#############################################
# main.tf  — minimal S3 + CloudFront (OAI)
#############################################

terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# ====== Basic inputs ======
variable "aws_region" {
  description = "Region for the S3 bucket (CloudFront is global)"
  type        = string
  default     = "us-west-1"
}

variable "project_name" {
  description = "Prefix for resource names"
  type        = string
  default     = "ab-testing-frontend"
}

provider "aws" {
  profile = "iamadmin-projects-prod"
  region = var.aws_region
}

# ====== S3: private website bucket ======
resource "aws_s3_bucket" "site" {
  bucket = "${var.project_name}-site"
}

# Keep ownership sane; avoid ACL warnings
resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# Block public access at account/bucket level
resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = false # keep false so we can attach *our* restrictive policy
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Optional but useful: versioning for rollbacks
resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Use AWS managed response-headers policy that adds CORS + preflight headers
data "aws_cloudfront_response_headers_policy" "cors_with_preflight" {
  name = "Managed-CORS-With-Preflight"
}


# ====== CloudFront: OAI (Origin Access Identity) ======
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${var.project_name}"
}

# ====== CloudFront distribution ======
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  comment             = "${var.project_name} distribution"
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id   = "s3-${aws_s3_bucket.site.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    target_origin_id       = "s3-${aws_s3_bucket.site.id}"
    viewer_protocol_policy = "redirect-to-https"

    # Allow OPTIONS for preflight
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]

    compress = true

    # Keep the managed caching policy you already use
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimized

    # Attach the CORS response headers policy
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.cors_with_preflight.id
  }

  # Cheapest global footprint
  price_class = "PriceClass_100"

  # SPA-friendly: serve index.html on 404/403 (client-side routing)
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Default CloudFront certificate (works on *.cloudfront.net)
  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }
}

# ====== S3 bucket policy: allow reads only from this CloudFront OAI ======
data "aws_iam_policy_document" "site_policy" {
  statement {
    sid     = "AllowCloudFrontReadOnly"
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]

    principals {
      type        = "CanonicalUser"
      identifiers = [aws_cloudfront_origin_access_identity.oai.s3_canonical_user_id]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site_policy.json

  depends_on = [
    aws_s3_bucket_public_access_block.site
  ]
}

# ====== Useful outputs ======
output "bucket_name" {
  value       = aws_s3_bucket.site.bucket
  description = "S3 bucket to upload your static build to"
}

output "cloudfront_domain" {
  value       = aws_cloudfront_distribution.cdn.domain_name
  description = "CloudFront domain to access the site"
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.cdn.id
  description = "CloudFront distribution ID (for invalidations)"
}
