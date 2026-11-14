variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "project_name" {
  type    = string
  default = "net-commerce"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,31}$", var.project_name))
    error_message = "Use 3-32 lowercase letters, digits or hyphens, starting with a letter."
  }
}

variable "instance_type" {
  description = "Use an x86_64 instance; t3.medium has 4 GiB RAM for the build and stack."
  type        = string
  default     = "t3.medium"

  validation {
    condition     = contains(["t3.medium", "t3.large", "t3.xlarge", "t3a.medium", "t3a.large", "t3a.xlarge"], var.instance_type)
    error_message = "Choose t3/t3a medium, large or xlarge. ARM images are not configured."
  }
}

variable "root_volume_size" {
  type    = number
  default = 40

  validation {
    condition     = var.root_volume_size >= 30 && floor(var.root_volume_size) == var.root_volume_size
    error_message = "The root disk must be an integer of at least 30 GiB."
  }
}

variable "key_pair_name" {
  description = "Existing EC2 key pair in the selected AWS account and region."
  type        = string
  default     = "aws-key-pair"

  validation {
    condition     = length(trimspace(var.key_pair_name)) > 0 && var.key_pair_name == trimspace(var.key_pair_name)
    error_message = "Set the name of an existing EC2 key pair without leading or trailing spaces."
  }
}

