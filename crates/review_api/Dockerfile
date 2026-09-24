FROM rust:1.93-bookworm AS builder
WORKDIR /build
COPY crates/review_api/Cargo.toml crates/review_api/Cargo.lock crates/review_api/
COPY crates/review_api/src crates/review_api/src
COPY db/migrations db/migrations
RUN cargo build --release --locked --manifest-path crates/review_api/Cargo.toml

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates python3-minimal \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 malina \
    && useradd --system --uid 10001 --gid 10001 --no-create-home malina \
    && mkdir -p /data /app/db/migrations \
    && chown malina:malina /data
COPY --from=builder /build/crates/review_api/target/release/malina-review-api /usr/local/bin/malina-review-api
COPY db/catalog.py /app/db/catalog.py
COPY db/migrations /app/db/migrations
USER 10001:10001
ENV MALINA_DB_PATH=/data/catalog.sqlite3 MALINA_BIND_ADDR=0.0.0.0:8080
VOLUME /data
EXPOSE 8080
CMD ["malina-review-api"]
