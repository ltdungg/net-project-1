output "public_ip" {
  description = "Stable public IPv4; point your optional domain A record here."
  value       = aws_eip.app.public_ip
}

output "instance_id" {
  value = aws_instance.app.id
}

output "demo_url" {
  description = "HTTP demo URL when DOMAIN is empty."
  value       = "http://${aws_eip.app.public_ip}"
}
