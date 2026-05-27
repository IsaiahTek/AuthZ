# Performance Report - AuthZ SDK

This report summarizes the performance benchmarks of the `@vynelix/authz-core` engine after optimizing for high-throughput APIs.

## 📊 Benchmark Results

| Scenario | Ops/sec | Average Latency | Notes |
| :--- | :--- | :--- | :--- |
| **RBAC Only** | ~438k | 2.27µs | Deep hierarchy (100 levels) |
| **PBAC Only** | ~312k | 3.19µs | 100 indexed policies |
| **Combined** | ~237k | 4.20µs | Both engines (No Cache) |
| **Combined + Cache** | **~716k** | **1.39µs** | **3.5x Speedup** |

## 🚀 Optimization Highlights

### 1. Policy Indexing (PBAC)
We moved from an $O(n)$ scanning approach to an indexed lookup. Policies are now grouped by `action` during engine initialization.
*   **Impact**: Performance remains stable even as the number of policies grows, as we only evaluate policies relevant to the current action.

### 2. RBAC Flattening
Roles are flattened at build-time with cycle detection. 
*   **Impact**: Permission checks are reduced to a simple `Set.has()` lookup, making it $O(1)$ regardless of hierarchy depth.

### 3. Per-Request Caching
Implemented a non-TTL `Map` cache for the duration of a single request lifecycle.
*   **Impact**: Redundant checks (e.g., checking the same permission across multiple fields in a list) are effectively free after the first evaluation.

## 🛠 Methodology
*   **Hardware**: Intel/AMD Linux Environment
*   **Library**: `tinybench`
*   **Setup**: 100 roles with deep inheritance + 100 policies with conditions.
