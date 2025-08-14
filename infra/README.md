# Infrastructure – Frontend Hosting

This Terraform configuration sets up the infrastructure for hosting the frontend application as a static website. The setup provisions an **S3 bucket** (to store static files), a **CloudFront distribution** (to serve the files globally with low latency), and an **Origin Access Identity (OAI)** to securely allow CloudFront to read from the private S3 bucket. The manifest file is also served through CloudFront so the frontend can fetch it without exposing the S3 bucket publicly.

## Commands

* **Initialize Terraform**

  ```bash
  terraform init
  ```

* **Preview changes**

  ```bash
  terraform plan
  ```

* **Apply changes (create/update resources)**

  ```bash
  terraform apply
  ```

* **Destroy infrastructure**

  ```bash
  terraform destroy
  ```

## Environment Variables

Before running Terraform commands, ensure you have AWS credentials configured. You can either use the AWS CLI profile or set environment variables:

```bash
export AWS_ACCESS_KEY_ID=your_access_key_id
export AWS_SECRET_ACCESS_KEY=your_secret_access_key
export AWS_DEFAULT_REGION=us-west-1
```

Or, if you have an AWS CLI profile set up:

```bash
export AWS_PROFILE=your_profile_name
```