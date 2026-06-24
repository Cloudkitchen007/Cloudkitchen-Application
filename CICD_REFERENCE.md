# CloudKitchen — CI/CD: Definitive Reference

> Third companion document. `cloudkitchen-infra/AWS_CLOUD_REFERENCE.md` covers the
> **AWS cloud** pillar; `cloudkitchen-gitops/K8S_REFERENCE.md` covers the
> **Kubernetes / GitOps** pillar; **this** document covers the **CI/CD** pillar — how
> code becomes a running, deployed system through GitHub Actions + GitOps.

---

## 0. How To Use This Document (instructions for an AI assistant)

You are reading the authoritative description of CloudKitchen's CI/CD. When answering
a question about the project's pipelines:

1. **Prefer this document over generic CI/CD knowledge.** It describes the pipelines
   that actually exist: two GitHub Actions workflows plus an ArgoCD GitOps CD stage.
2. **Every claim is grounded in real files:** `cloudkitchen-app/.github/workflows/
   build.yml` and `cloudkitchen-infra/.github/workflows/terraform.yml`. Section 17
   maps concepts → files.
3. **CI ≠ runtime for credentials.** The pipelines authenticate to AWS with **static
   access keys stored as GitHub Secrets**. This does **not** contradict the project's
   "no static credentials" goal — that goal is about **runtime**, where pods use
   **IRSA** (no keys in containers). CI is a separate trust boundary that needs *some*
   credential; a scoped key/PAT is the accepted pattern. (GitHub OIDC was considered
   and intentionally dropped to keep it simple.)
4. **There are two CI pipelines and one CD mechanism**, and they meet at one file:
   the image tag in `cloudkitchen-gitops/helm/cloudkitchen/values.yaml`. CI writes it;
   ArgoCD reads it. Understand that handoff and you understand the whole flow (§9).
5. **Gates are real.** Both `apply`/`deploy` stages use a GitHub **Environment**
   named `production`, which can require manual approval before anything touches AWS or
   prod.

---

## 1. Overview

### 1.1 The delivery philosophy
CloudKitchen separates **CI** (build, test, scan, publish artifacts) from **CD**
(reconcile the cluster to desired state). CI runs in GitHub Actions and ends by
**publishing artifacts** (container images to ECR; infra changes to AWS). CD for the
application is **pull-based GitOps**: ArgoCD watches the gitops repo and applies
changes — CI never runs `kubectl` against the cluster.

### 1.2 The three repos and their pipelines
| Repo | Pipeline | What it delivers |
|------|----------|------------------|
| `cloudkitchen-app` | `build.yml` — *Build, Scan & Push* | container images → ECR, then bumps the image tag in the gitops repo |
| `cloudkitchen-infra` | `terraform.yml` — *Terraform* | AWS infrastructure (plan on PR, gated apply on main) |
| `cloudkitchen-gitops` | *(no workflow)* | is the **CD source of truth**; ArgoCD syncs it. No CI today (see §15 for a suggested helm-lint addition) |

### 1.3 The two halves
- **CI (push artifacts):** GitHub Actions builds/tests/scans and pushes images +
  applies infra.
- **CD (pull to cluster):** ArgoCD (covered in `K8S_REFERENCE.md` §3) reconciles the
  Helm chart from the gitops repo onto EKS. This document references it but does not
  duplicate it.

---

## 2. Pipeline Map (one glance)

```
 cloudkitchen-app  ──push/PR──►  build.yml
   ├─ build (matrix x5): lint+test → Semgrep → Trivy fs → build → Trivy image → push ECR
   └─ deploy (main, gated): bump imageTag in cloudkitchen-gitops, git push
                                                   │
                                                   ▼
 cloudkitchen-gitops (values.yaml imageTag) ──watched by──► ArgoCD ──► EKS pods
                                                   ▲
 cloudkitchen-infra ──push/PR──► terraform.yml     │ (infra the cluster runs on)
   ├─ validate-plan: fmt → validate → plan
   └─ apply (main, gated): terraform apply
```

---

## 3. The Application Pipeline (`build.yml`)

**Name:** *Build, Scan & Push*. **Triggers:** `push` to `main`, and `pull_request`
(any branch). **Workflow env:** `AWS_REGION=ap-south-1`,
`ECR_REGISTRY=256603361470.dkr.ecr.ap-south-1.amazonaws.com`.

It has two jobs: `build` (always) and `deploy` (main only, gated).

### 3.1 Job `build` — the matrix
Runs once per service via a `strategy.matrix` with `fail-fast: false` (one service
failing doesn't cancel the others):

| matrix `service` | matrix `repo` (ECR) |
|------------------|---------------------|
| `menu-service` | `cloudkitchen-menu-repo` |
| `order-service` | `cloudkitchen-order-repo` |
| `auth-service` | `cloudkitchen-auth-repo` |
| `ai-recommender` | `cloudkitchen-ai-repo` |
| `frontend` | `cloudkitchen-app-repo` |

> Note: the frontend **image** is still built and scanned here (defence-in-depth /
> rubric), even though at runtime the SPA is served as static files from S3 (see
> `K8S_REFERENCE.md` §5.5). The Dockerfile uses `nginx-unprivileged`.

### 3.2 Job `build` — the steps (in order)
1. **`actions/checkout@v4`** — clone the app repo.
2. **Java lint + test** — *if* `${service}/pom.xml` exists: `mvn -B test`. (Real gate
   for the 3 Spring services — a failing test fails the job.)
3. **Python lint + test** — *if* `${service}/requirements.txt` exists: install
   `ruff`+`pytest`, then `ruff check .` and `pytest` (both `|| true`, i.e.
   report-only for the AI service).
4. **Frontend lint + test** — *if* `${service}/package.json` exists: `npm ci`,
   `npm run lint --if-present`, `CI=true npm test --if-present` (both `|| true`).
5. **Semgrep SAST** — `semgrep --config auto` on the service dir.
   `continue-on-error: true` (report-only).
6. **Trivy filesystem scan** — `aquasecurity/trivy-action`, `scan-type: fs`,
   `severity: HIGH,CRITICAL`, **`exit-code: '0'`** (report-only; set to `1` to fail on
   findings).
7. **Configure AWS credentials** — `aws-actions/configure-aws-credentials@v4` from
   `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` secrets.
8. **ECR login** — `aws ecr get-login-password | docker login`.
9. **Build image** — `docker build` tagging both
   `:${{ github.sha }}` and `:latest`.
10. **Trivy image scan** — scans the built `:${sha}` image, `HIGH,CRITICAL`,
    `exit-code: '0'` (report-only).
11. **Push image** — **only on `main`** (`if: github.ref == 'refs/heads/main'`):
    pushes both the `:${sha}` and `:latest` tags.

> Net effect on a **PR**: full build + scan, **no push** (validation only).
> On **main**: build + scan + **push**.

### 3.3 Job `deploy` — bump the GitOps image tag
- **`needs: build`**, **`if: github.ref == 'refs/heads/main'`**,
  **`environment: production`** (manual-approval gate).
- Steps: checkout the **gitops** repo
  (`${{ github.repository_owner }}/cloudkitchen-gitops`, `token: GITOPS_TOKEN`),
  `sed` the `imageTag:` line in `helm/cloudkitchen/values.yaml` to `${github.sha}`,
  then `git commit` + `git push`.
- ArgoCD then sees the new SHA and rolls the Deployments. This is the **CI→CD
  handoff**.

### 3.4 The `GITOPS_TOKEN` requirement
The `deploy` job checks out a **different** repo than the one running the workflow. The
built-in `GITHUB_TOKEN` is scoped only to `cloudkitchen-app`, so it **cannot** write to
`cloudkitchen-gitops`. You must provide a **fine-grained PAT** with **Contents: Read
and write** on `cloudkitchen-gitops`, stored as the secret **`GITOPS_TOKEN`**. Without
it the job fails with `Error: Input required and not supplied: token`. (See §13.)

---

## 4. The Infrastructure Pipeline (`terraform.yml`)

**Name:** *Terraform*. **Triggers:** `push` to `main`, and `pull_request`.
**Workflow env:** `AWS_REGION=ap-south-1`, `TF_IN_AUTOMATION=true`.

Two jobs: `validate-plan` (always) and `apply` (main push, gated).

### 4.1 Job `validate-plan`
1. `actions/checkout@v4`.
2. `hashicorp/setup-terraform@v3` with `terraform_version: '~1.9'`.
3. `aws-actions/configure-aws-credentials@v4` (AWS key secrets).
4. **Init** — `terraform init` (uses the S3 backend + DynamoDB lock).
5. **Format** — `terraform fmt -check -recursive` (`continue-on-error: true` —
   reports formatting drift without failing).
6. **Validate** — `terraform validate` (real gate; config must be valid).
7. **Plan** — `terraform plan -input=false`, with
   `TF_VAR_hf_api_token: ${{ secrets.HF_API_TOKEN }}`.

> Because `plan` runs non-interactively, **every required variable must have a default
> or be supplied**. CI only injects `TF_VAR_hf_api_token`; all other variables must
> carry defaults, or `plan` fails with "No value for required variable" (§13).

### 4.2 Job `apply` (gated)
- **`needs: validate-plan`**,
  **`if: github.ref == 'refs/heads/main' && github.event_name == 'push'`**,
  **`environment: production`** (manual approval).
- Re-checkout, setup-terraform, AWS creds, `terraform init`, then
  **`terraform apply -auto-approve -input=false`** with `TF_VAR_hf_api_token`.

> This pipeline applies the *infrastructure*. The second, NLB-dependent apply that
> wires CloudFront→NLB (`wire-cloudfront.sh`) is part of the **deploy script** flow,
> not this CI pipeline, because it needs the live NLB DNS (see `K8S_REFERENCE.md` §7).

---

## 5. The CD Half (ArgoCD GitOps)

CD for the application is **not** in GitHub Actions — it is ArgoCD pulling from the
gitops repo. Full detail in `cloudkitchen-gitops/K8S_REFERENCE.md` §3. The CI/CD-
relevant summary:
- CI's `deploy` job changes `values.yaml`'s `imageTag` → ArgoCD detects the commit →
  syncs → rolling update.
- `automated.selfHeal: true` means the cluster is continuously reconciled to Git;
  manual `kubectl` edits are reverted.
- Roll back a deploy by reverting the `imageTag` commit in the gitops repo (Git is the
  audit log of every deployment).

---

## 6. Secrets & Configuration

### 6.1 Required GitHub Secrets
| Secret | Used by | Purpose |
|--------|---------|---------|
| `AWS_ACCESS_KEY_ID` | both pipelines | AWS auth (ECR push / Terraform) |
| `AWS_SECRET_ACCESS_KEY` | both pipelines | AWS auth |
| `HF_API_TOKEN` | `terraform.yml` | `TF_VAR_hf_api_token` (stored into Secrets Manager by Terraform) |
| `GITOPS_TOKEN` | `build.yml` `deploy` | fine-grained PAT, Contents:write on the gitops repo |

> The user's org currently holds AWS key id/secret + HF token. **`GITOPS_TOKEN` must
> be added** for the `deploy` job to function.

### 6.2 Non-secret config
Pipeline-level `env` (region, ECR registry) is in the workflow files. The deterministic
account id and ECR registry are hard-coded; change them there to target another
account.

### 6.3 What is NOT a secret in CI
Image tags (git SHAs), repo names, and region are not sensitive. Runtime app secrets
(DB creds, Cognito IDs) never pass through CI at all — they live in AWS Secrets Manager
and reach pods via ESO (see `K8S_REFERENCE.md` §8).

---

## 7. Environments & Approval Gates

Both deploy-class jobs (`build.yml`→`deploy`, `terraform.yml`→`apply`) declare
`environment: production`. In GitHub, a Protected Environment can require **required
reviewers** (manual approval), **wait timers**, and **branch restrictions** before the
job runs. This is the human gate between "validated" and "applied to prod" — PRs and
non-main pushes never reach these jobs.

---

## 8. Security in the Pipeline (DevSecOps)

| Control | Tool | Stage | Mode |
|---------|------|-------|------|
| SAST (static code analysis) | **Semgrep** (`--config auto`) | app build | report-only (`continue-on-error`) |
| Dependency/code vuln scan | **Trivy** `fs` | app build | report-only (`exit-code 0`) |
| Image vuln scan | **Trivy** `image` | app build | report-only (`exit-code 0`) |
| Lint/test | mvn / ruff+pytest / npm | app build | Java = gate; Python/JS = report-only |
| IaC validity | `terraform validate` | infra | gate |
| IaC formatting | `terraform fmt -check` | infra | report-only |
| Least-privilege runtime | IRSA (not CI) | runtime | enforced in cluster |

> To **enforce** (fail builds on) findings: set the Trivy steps' `exit-code` to `'1'`
> and remove `|| true` / `continue-on-error` from the scanners you want to be gates.
> They are report-only now so a clean demo isn't blocked by upstream CVEs.

---

## 9. End-to-End Delivery Flow (commit → running pod)

**Application change:**
1. Developer opens a PR to `cloudkitchen-app`. `build.yml` runs build + all scans for
   the 5 services — **no push** (validation).
2. PR merges to `main`. `build.yml` re-runs and **pushes** `:${sha}` + `:latest` to
   ECR for each service.
3. The `deploy` job waits on the `production` environment approval, then bumps
   `imageTag` → `${sha}` in the gitops repo and pushes.
4. ArgoCD detects the gitops commit and performs a rolling update to the new image.
5. New pods pass readiness; old pods retire. The change is live.

**Infrastructure change:**
1. PR to `cloudkitchen-infra` → `terraform.yml` runs `fmt`/`validate`/`plan`.
2. Merge to `main` → `apply` job (after `production` approval) runs `terraform apply`.
3. If the change affects the NLB/CloudFront wiring, run `wire-cloudfront.sh` (deploy
   flow), since that needs the live NLB DNS.

---

## 10. CI vs the local `deploy.sh`

`deploy.sh` (in the gitops repo) performs the **same logical steps** as the pipelines
but **locally and in one shot** — build+push images, apply infra, install platform,
sync app, wire CloudFront. Use it for a full from-scratch stand-up or recreate; use the
**pipelines** for ongoing, reviewed, gated change delivery. They are not in conflict:
both converge on the same ECR images and the same gitops `imageTag`.

| | GitHub Actions | `deploy.sh` |
|-|----------------|-------------|
| Trigger | git push / PR | manual run |
| Scope | per-repo change | whole platform |
| Gates | environment approval | none (operator-driven) |
| Image tag | git SHA, committed to gitops | `:latest` |
| Best for | day-to-day delivery | initial deploy / full recreate |

---

## 11. Branch & Event Behaviour Matrix

| Event | `build.yml` build job | `build.yml` deploy job | `terraform.yml` plan | `terraform.yml` apply |
|-------|----------------------|------------------------|----------------------|-----------------------|
| PR (any branch) | run (no push) | skip | run | skip |
| Push to `main` | run + push images | run (gated) | run | run (gated) |
| Push to other branch | build.yml: only on PR or main (no trigger otherwise) | — | terraform.yml: same | — |

---

## 12. Extending the Pipelines

**Add a new microservice:**
1. Add its folder + Dockerfile under `cloudkitchen-app`.
2. Add a row to the `build.yml` matrix (`service` + `repo`).
3. Create the ECR repo in `cloudkitchen-infra` (and any IRSA role if it needs AWS).
4. Add it to `cloudkitchen-gitops/helm/cloudkitchen/values.yaml` `services` (port,
   replicas, `pathPrefixes`, SA) — ArgoCD deploys it.

**Make a scanner a hard gate:** set Trivy `exit-code: '1'` and drop `continue-on-error`
on Semgrep.

**Add helm validation:** add a workflow to the gitops repo running `helm lint` +
`helm template | kubeconform` on PRs (recommended — see §15).

---

## 13. Failure Modes & Troubleshooting

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| `deploy` job: `Error: Input required and not supplied: token` | cross-repo checkout of gitops with no `GITOPS_TOKEN` | add fine-grained PAT (Contents:write on gitops) as secret `GITOPS_TOKEN` |
| `terraform plan`: `No value for required variable` | a required var without a default isn't supplied in CI | give the variable a default, or pass `-var`/`TF_VAR_*`. (Dead EC2 vars `web_ami_id`/`app_ami_id` were removed; `admin_email` got a default.) |
| `Node 20 is being deprecated…` warning | GitHub runner deprecation notice | harmless warning; optionally bump actions to `@v5` |
| Images not appearing in ECR on a PR | by design — push is `main`-only | merge to main, or test locally |
| `deploy`/`apply` job never runs | waiting on `production` environment approval | approve the deployment in the Actions UI |
| Java build fails | a unit test or compile error (real gate) | fix the test/code |
| Semgrep/Trivy findings don't fail build | report-only by design | set `exit-code: '1'` / remove `continue-on-error` to enforce |
| ECR login fails | bad/expired AWS key secrets | rotate `AWS_ACCESS_KEY_ID`/`SECRET` |

---

## 14. Why these choices (design rationale)

- **Static AWS keys in CI, IRSA at runtime.** CI is a distinct trust boundary; it needs
  a credential to push to ECR / run Terraform. The "no static creds" principle applies
  to **pods**, satisfied by IRSA. GitHub OIDC-to-AWS was evaluated and dropped to keep
  the setup approachable.
- **Pull-based CD (ArgoCD) over push-based (`kubectl` in CI).** Git becomes the audit
  log and rollback mechanism; the cluster self-heals; CI needs no cluster credentials.
- **Report-only scanners by default.** Keeps the demo unblocked by upstream CVEs while
  still surfacing findings; flip to gates with one line each.
- **Per-service matrix.** Parallel, independent builds; `fail-fast: false` so one bad
  service doesn't mask the others.
- **Environment gates on apply/deploy.** A human checkpoint before anything mutates
  prod or AWS.

---

## 15. Recommended hardening (not yet implemented)

- **GitOps repo CI:** add `helm lint` + `helm template | kubeconform -strict` on PRs
  so chart errors are caught before ArgoCD tries to sync.
- **Enforce scanners:** promote Trivy/Semgrep to gates for production.
- **Pin action SHAs** (supply-chain) instead of floating tags like `@master` (the
  Trivy action uses `@master`).
- **OIDC to AWS** if you later want to eliminate the long-lived AWS keys in CI.
- **Dependabot/renovate** for action + dependency updates.

---

## 16. FAQ

**Q: Does CI deploy to the cluster?** No. CI pushes images and bumps the gitops image
tag; **ArgoCD** deploys (pull-based).

**Q: How do I roll back a bad deploy?** Revert the `imageTag` commit in the gitops repo
(or `git revert`), push; ArgoCD rolls back. Infra: revert and re-apply.

**Q: Why does a PR not deploy anything?** PRs build + scan only (validation). Push +
gate are required to publish/deploy.

**Q: Where do runtime secrets come from — surely not CI?** Correct — never CI. They're
in AWS Secrets Manager, synced to pods by ESO. CI only handles `HF_API_TOKEN` (into
Secrets Manager via Terraform) and AWS/GitOps credentials.

**Q: What's the single point that connects CI and CD?** The `imageTag` field in
`cloudkitchen-gitops/helm/cloudkitchen/values.yaml`.

**Q: Can I deploy without GitHub Actions at all?** Yes — `deploy.sh` does the whole
thing locally (§10).

---

## 17. File Index (concept → file)

| Concept | File |
|---------|------|
| App pipeline (build/scan/push + gitops bump) | `cloudkitchen-app/.github/workflows/build.yml` |
| Infra pipeline (fmt/validate/plan/apply) | `cloudkitchen-infra/.github/workflows/terraform.yml` |
| CD source of truth (image tag, chart) | `cloudkitchen-gitops/helm/cloudkitchen/values.yaml` |
| ArgoCD Application (the CD agent) | `cloudkitchen-gitops/argocd/application.yaml` |
| Local full-deploy equivalent | `cloudkitchen-gitops/deploy.sh` |
| CloudFront→NLB rewire (post-apply) | `cloudkitchen-gitops/wire-cloudfront.sh` |
| Service Dockerfiles (built by CI) | `cloudkitchen-app/<service>/Dockerfile` |
| Terraform variables (CI must satisfy) | `cloudkitchen-infra/variables.tf` |

---

## 18. Glossary

- **CI / CD** — Continuous Integration (build/test/scan/publish) / Continuous Delivery
  (reconcile desired state to the environment).
- **GitOps** — CD pattern where Git is desired state and a controller (ArgoCD) syncs it.
- **Matrix build** — one job definition fanned out over a list (here, the 5 services).
- **SAST** — Static Application Security Testing (Semgrep).
- **Trivy** — vulnerability scanner (filesystem + container image).
- **Environment (GitHub)** — a protected deployment target that can require approval.
- **PAT** — Personal Access Token; `GITOPS_TOKEN` is a fine-grained, single-repo PAT.
- **IRSA** — runtime AWS auth for pods (contrast with CI's static keys).
- **GITHUB_TOKEN** — the workflow's built-in token, scoped to its own repo only.
- **report-only vs gate** — a scan that warns vs one that fails the build.

---

*End of CloudKitchen CI/CD Reference. See also `cloudkitchen-infra/
AWS_CLOUD_REFERENCE.md` (cloud) and `cloudkitchen-gitops/K8S_REFERENCE.md`
(Kubernetes/GitOps).*
