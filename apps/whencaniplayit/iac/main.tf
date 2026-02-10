terraform {
  backend "s3" {
    bucket              = "632700996244-markdferrari-terraform-state"
    key                 = "wherecaniplayit/terraform.tfstate"
    region              = "eu-west-1"
    allowed_account_ids = ["632700996244"]

  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region  = "us-east-1"
  profile = "markdferrari"
}

# Route53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name        = var.domain_name
    Environment = "production"
  }
}

# Output the nameservers
output "nameservers" {
  description = "Nameservers for whencaniplayit.com"
  value       = aws_route53_zone.main.name_servers
}

output "zone_id" {
  description = "Route53 Zone ID"
  value       = aws_route53_zone.main.zone_id
}
