# ODS single-node K3s deployment

This overlay is intentionally sized for the thesis prototype: one 2-core, 4-GB server with a 60-GB disk. It demonstrates container scheduling, probes, restart behavior, secrets, HTTPS ingress, and resource limits. It is not a physically highly available deployment.

1. Install K3s and configure a DNS record for the server.
2. Create the namespace with `kubectl apply -f deploy/k8s/namespace.yaml`.
3. Copy `secret.example.yaml` to a file outside the repository, replace every placeholder, and apply it with `kubectl apply -f <secret-file>`.
4. Create the TLS secret with `kubectl -n ods create secret tls ods-tls --cert <certificate> --key <private-key>`.
5. Replace `ods.example.com` in `configmap.yaml` and `ingress.yaml`.
6. Set the backend and frontend image versions in their deployments.
7. Run `kubectl apply -k deploy/k8s`.
8. Check `kubectl -n ods get pods` and `/actuator/health` before enabling user traffic.

Attachments are not stored on this server. Configure an external S3-compatible object store when the file module is enabled. OpenSearch and multi-node PostgreSQL, Redis, and RabbitMQ belong to the enterprise deployment design because this server cannot run them reliably.
