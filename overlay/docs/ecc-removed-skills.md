# Узкие навыки ECC, убранные из проекта

Файл создаёт `node scripts/ecc-postinstall.mjs` из `ecc-pruned-skills.json`. Правьте список там, а не здесь.

Из полной установки ECC убраны узкоспециализированные навыки, всего 82, чтобы их описания не занимали лишний контекст в каждом чате. Все они лежат в репозитории ECC на коммите [`4eb71d92`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2).

## Как вернуть

Один навык на время, без изменения проекта: откройте ссылку ниже и попросите агента прочитать `SKILL.md`.

Насовсем: удалите навык из `ecc-pruned-skills.json`. Если весь его модуль исключён в `ecc-install.json` (`exclude`), уберите оттуда и модуль. Затем повторите установку из README.

## Логистика, закупки и производство

Отраслевые процессы цепочек поставок, к разработке не относятся.

| Навык | Модуль ECC | Описание |
|---|---|---|
| [`carrier-relationship-management`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/carrier-relationship-management) | `supply-chain-domain` | Manage truckload, LTL, and intermodal carrier portfolios: sourcing and FMCSA vetting, freight rate and fuel-surcharge negotiation, RFPs and routing guides, carrier scorecards, allocation, and renew... |
| [`customs-trade-compliance`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/customs-trade-compliance) | `supply-chain-domain` | Codified customs and trade compliance expertise — HS/HTS tariff classification with GRI rules, commercial invoices and entry documentation, Incoterms 2020, FTA qualification and duty optimization (... |
| [`energy-procurement`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/energy-procurement) | `supply-chain-domain` | Procure electricity and natural gas for commercial and industrial facilities: tariff and rate-schedule optimization, demand-charge mitigation, supplier RFPs, fixed/index/block-and-index hedging, re... |
| [`inventory-demand-planning`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/inventory-demand-planning) | `supply-chain-domain` | Codified demand planning expertise for multi-location retailers: demand forecasting method selection, ABC/XYZ segmentation, safety stock and reorder-point optimization, promotional lift and post-pr... |
| [`logistics-exception-management`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/logistics-exception-management) | `supply-chain-domain` | Codified freight-exception handling expertise for shipment delays, damages, losses, shortages, and carrier disputes, with escalation protocols, carrier-specific behaviors by mode, claims procedures... |
| [`production-scheduling`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/production-scheduling) | `supply-chain-domain` | Codified expertise for production scheduling, job sequencing, line balancing, changeover optimization, and bottleneck resolution in discrete and batch manufacturing. |
| [`quality-nonconformance`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/quality-nonconformance) | `supply-chain-domain` | Quality control and non-conformance management for regulated manufacturing (FDA 21 CFR 820, IATF 16949, AS9100): NCR lifecycle and disposition, 5-Why/Ishikawa/fault-tree/8D root cause analysis, CAP... |
| [`returns-reverse-logistics`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/returns-reverse-logistics) | `supply-chain-domain` | Codified expertise for returns authorization, receipt and inspection, disposition decisions, refund processing, fraud detection, and warranty claims management. |

## Финансы, крипта и рынки предсказаний

Узкая финансовая и блокчейн-специфика.

| Навык | Модуль ECC | Описание |
|---|---|---|
| [`ito-baskets`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/ito-baskets) | `prediction-market-skills` | Read-only Itô basket and prediction-market data skill. |
| [`prediction-market-oracle-research`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/prediction-market-oracle-research) | `prediction-market-skills` | Research prediction markets as data sources or oracle signals for products, agents, dashboards, and corporate decision intelligence. |
| [`prediction-market-risk-review`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/prediction-market-risk-review) | `prediction-market-skills` | Review prediction-market, basket, oracle, and trading-agent workflows for compliance, safety, data-quality, privacy, and execution risk. |
| [`defi-amm-security`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/defi-amm-security) | `security` | Security checklist for Solidity AMM contracts, liquidity pools, and swap flows. |
| [`evm-token-decimals`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/evm-token-decimals) | `security` | Prevent silent decimal mismatch bugs across EVM chains. |
| [`nodejs-keccak256`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/nodejs-keccak256) | `security` | Prevent Ethereum hashing bugs in JavaScript and TypeScript. |
| [`llm-trading-agent-security`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/llm-trading-agent-security) | `security` | Security patterns for autonomous trading agents with wallet or transaction authority. |
| [`agent-payment-x402`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/agent-payment-x402) | `agentic-patterns` | Add x402 payment execution to AI agents with per-task budgets, spending controls, and non-custodial wallets. |
| [`customer-billing-ops`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/customer-billing-ops) | `operator-workflows` | Operate customer billing workflows such as subscriptions, refunds, churn triage, billing-portal recovery, and plan analysis using connected billing tools like Stripe. |
| [`finance-billing-ops`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/finance-billing-ops) | `operator-workflows` | Evidence-first revenue, pricing, refunds, team-billing, and billing-model truth workflow for ECC. |
| [`token-card`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/token-card) | `operator-workflows` | Render a token-usage stat card from local Claude Code, Codex, Gemini CLI, and OpenCode session logs and commit it into the repository as a file. |

## Медицинские информационные системы

Разработка EMR/CDSS и соответствие HIPAA — узкая отраслевая область.

| Навык | Модуль ECC | Описание |
|---|---|---|
| [`healthcare-phi-compliance`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/healthcare-phi-compliance) | `security` | Protected Health Information (PHI) and PII compliance patterns for healthcare applications: data classification, row-level access control, tamper-proof audit trails, schema tagging, and common leak... |
| [`hipaa-compliance`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/hipaa-compliance) | `security` | HIPAA-specific entrypoint for healthcare privacy and security work. |
| [`healthcare-cdss-patterns`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/healthcare-cdss-patterns) | `security` | Clinical Decision Support System (CDSS) development patterns. |
| [`healthcare-emr-patterns`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/healthcare-emr-patterns) | `security` | EMR/EHR development patterns for healthcare applications. |
| [`healthcare-eval-harness`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/healthcare-eval-harness) | `security` | Patient safety evaluation harness for healthcare application deployments. |

## Сервисы конкретных вендоров

Требуют аккаунта или CLI конкретного сервиса.

| Навык | Модуль ECC | Описание |
|---|---|---|
| [`ito-compute`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/ito-compute) | `ito-compute` | Query live GPU inventory, submit an authenticated Itô fixed-rate RFQ, inspect RFQ or procurement status, revoke device credentials, and run explicitly gated node qualification through the separatel... |
| [`ito-inference`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/ito-inference) | `ito-compute` | Inspect the availability of model serving on a completed Itô compute booking and, when the canonical backend becomes available, hand off an explicitly confirmed serving manifest. |
| [`ito-training`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/ito-training) | `ito-compute` | Inspect the availability of ML training on a completed Itô compute booking and, when the canonical backend becomes available, hand off an explicitly confirmed training manifest. |
| [`nasiko-control-plane`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/nasiko-control-plane) | `nasiko-control-plane` | Manage the experimental Nasiko CLI lifecycle through ECC — read-only status checks, consent-gated install of the pinned qualified version with dry-run preview, and ownership-checked uninstall, unde... |
| [`nutrient-document-processing`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/nutrient-document-processing) | `document-processing` | Process, convert, OCR, extract, redact, sign, and fill documents using the Nutrient DWS API. |
| [`mailtrap-email-integration`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/mailtrap-email-integration) | `operator-workflows` | Guides agents through integrating transactional email sending via Mailtrap's Email API, including sandbox testing, domain verification, and API authentication. |
| [`ecc-tools-cost-audit`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/ecc-tools-cost-audit) | `operator-workflows` | Evidence-first ECC Tools burn and billing audit workflow. |
| [`flox-environments`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/flox-environments) | `devops-infra` | Create reproducible, cross-platform (macOS/Linux) development environments with Flox, a declarative Nix-based environment manager. |
| [`uncloud`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/uncloud) | `devops-infra` | Use when managing an Uncloud cluster — deploying services, configuring Caddy ingress, adding static proxy routes for non-cluster devices, publishing ports, scaling, inspecting logs, or managing mac... |
| [`unified-memory`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/unified-memory) | `skill-unified-memory` | Share durable, inspectable context and handoffs between Claude, Codex, Hermes, Cursor, OpenCode, and other agents through the local ECC Memory Vault. |

## Другие агентные среды

Рассчитаны на Claude DevFleet, NanoClaw, Hermes и OpenClaw, а не на Cursor.

| Навык | Модуль ECC | Описание |
|---|---|---|
| [`claude-devfleet`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/claude-devfleet) | `agentic-patterns` | Orchestrate multi-agent coding tasks via Claude DevFleet — plan projects, dispatch parallel agents in isolated worktrees, monitor progress, and read structured reports. |
| [`nanoclaw-repl`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/nanoclaw-repl) | `agentic-patterns` | Operate and extend NanoClaw, ECC's zero-dependency session-aware REPL, with persistent markdown-backed sessions and slash commands for model switching, skill loading, session branching, cross-sessi... |
| [`hermes-imports`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/hermes-imports) | `agentic-patterns` | Convert local Hermes operator workflows into sanitized ECC skills and release-pack artifacts. |
| [`openclaw-persona-forge`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/openclaw-persona-forge) | `agentic-patterns` | 为 OpenClaw AI Agent 锻造完整的龙虾灵魂方案。根据用户偏好或随机抽卡， 输出身份定位、灵魂描述(SOUL.md)、角色化底线规则、名字和头像生图提示词。 如当前环境提供已审核的生图 skill，可自动生成统一风格头像图片。 当用户需要创建、设计或定制 OpenClaw 龙虾灵魂时使用。 不适用于：微调已有 SOUL.md、非 OpenClaw 平台的角色设计、纯工具型无性格... |

## Сети и домашняя лаборатория

Сетевое железо Cisco, BGP, homelab.

| Навык | Модуль ECC | Описание |
|---|---|---|
| [`cisco-ios-patterns`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/cisco-ios-patterns) | `devops-infra` | Cisco IOS and IOS-XE review patterns for show commands, config hierarchy, wildcard masks, ACL placement, interface hygiene, and safe change-window verification. |
| [`netmiko-ssh-automation`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/netmiko-ssh-automation) | `devops-infra` | Safe Python Netmiko patterns for read-only collection, bounded batch SSH, TextFSM parsing, guarded config changes, timeouts, and network automation error handling. |
| [`network-bgp-diagnostics`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/network-bgp-diagnostics) | `devops-infra` | Diagnostics-only BGP troubleshooting patterns for neighbor state, route exchange, prefix policy, AS path inspection, and safe evidence collection. |
| [`network-config-validation`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/network-config-validation) | `devops-infra` | Pre-deployment checks for router and switch configuration, including dangerous commands, duplicate addresses, subnet overlaps, stale references, management-plane risk, and IOS-style security hygiene. |
| [`network-interface-health`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/network-interface-health) | `devops-infra` | Diagnose interface errors, drops, CRCs, duplex mismatches, flapping, speed negotiation issues, and counter trends on routers, switches, and Linux hosts. |
| [`homelab-network-readiness`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/homelab-network-readiness) | `devops-infra` | Readiness checklist for homelab VLAN segmentation, local DNS filtering (Pi-hole, AdGuard Home), and WireGuard-style remote access. |
| [`homelab-network-setup`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/homelab-network-setup) | `devops-infra` | Practical home and homelab network planning for gateways, switches, access points, IP ranges, DHCP reservations, DNS, cabling, and common beginner mistakes. |
| [`homelab-pihole-dns`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/homelab-pihole-dns) | `devops-infra` | Pi-hole installation, blocklist management, DNS-over-HTTPS setup, DHCP integration, local DNS records, and troubleshooting broken DNS resolution on a home network. |
| [`homelab-vlan-segmentation`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/homelab-vlan-segmentation) | `devops-infra` | Segmenting home networks into VLANs for IoT, guest, trusted, and server traffic using UniFi, pfSense/OPNsense, and MikroTik — including switch trunk config, firewall rules, and wireless SSID mapping. |
| [`homelab-wireguard-vpn`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/homelab-wireguard-vpn) | `devops-infra` | WireGuard VPN server setup, peer configuration, key generation, split tunneling vs full tunnel routing, and remote access to a home network from mobile and laptop clients. |

## Маркетинг, продажи и инвесторы

Узкие бизнес-процессы. Общие навыки письма, SEO и исследования рынка оставлены.

| Навык | Модуль ECC | Описание |
|---|---|---|
| [`investor-materials`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/investor-materials) | `business-content` | Create and update pitch decks, one-pagers, investor memos, accelerator applications, financial models, and fundraising materials. |
| [`investor-outreach`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/investor-outreach) | `business-content` | Draft cold emails, warm intro blurbs, follow-ups, update emails, and investor communications for fundraising. |
| [`lead-intelligence`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/lead-intelligence) | `business-content` | AI-native lead intelligence and outreach pipeline. |
| [`social-graph-ranker`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/social-graph-ranker) | `business-content` | Weighted social-graph ranking for warm intro discovery, bridge scoring, and network gap analysis across X and LinkedIn. |
| [`brand-discovery`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/brand-discovery) | `business-content` | Run a structured, resumable multi-session brand identity interview across 8 modules (purpose, positioning, audience, personality, voice, narrative, founder tension) using laddering, 5 Whys, and pro... |
| [`competitive-platform-analysis`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/competitive-platform-analysis) | `business-content` | Use when scoping a competitive landscape — identifying, categorising, and score-filtering a competitor set before any benchmarking begins. |
| [`competitive-report-structure`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/competitive-report-structure) | `business-content` | Assemble scored competitor profile cards (from benchmark-methodology) into a decision-grade competitive report with landscape map, competitor tiers, benchmarking matrix, white-space analysis, strat... |
| [`benchmark-methodology`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/benchmark-methodology) | `optimization-workflows` | Score a scoped competitor set into comparable profile cards: nine weighted dimensions (positioning, voice, visual craft, offer packaging, evidence, enterprise-readiness, thought leadership, pricing... |
| [`marketing-campaign`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/marketing-campaign) | `business-content` | End-to-end marketing campaign planning and execution. |

## Соцсети и публикации

Публикация в X, LinkedIn и других соцсетях.

| Навык | Модуль ECC | Описание |
|---|---|---|
| [`crosspost`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/crosspost) | `social-distribution` | Multi-platform content distribution across X, LinkedIn, Threads, and Bluesky. |
| [`x-api`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/x-api) | `social-distribution` | X/Twitter API integration for posting tweets, threads, reading timelines, search, and analytics. |
| [`social-publisher`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/social-publisher) | `social-distribution` | Agent-driven scheduling and publishing of social media posts across 13 platforms via SocialClaw. |

## Видео, 3D и медиагенерация

Монтаж видео, Remotion, Blender, генерация медиа.

| Навык | Модуль ECC | Описание |
|---|---|---|
| [`blender-motion-state-inspection`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/blender-motion-state-inspection) | `media-generation` | Use this skill when inspecting Blender characters, rigs, poses, animation retargeting, ground contact, facing direction, or model-vs-motion alignment where screenshots alone are not enough. |
| [`fal-ai-media`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/fal-ai-media) | `media-generation` | Unified media generation via fal.ai MCP — image, video, and audio. |
| [`manim-video`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/manim-video) | `media-generation` | Build reusable Manim explainers for technical concepts, graphs, system diagrams, and product walkthroughs, then hand off to the wider ECC video stack if needed. |
| [`remotion-video-creation`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/remotion-video-creation) | `media-generation` | Best practices for Remotion - Video creation in React. |
| [`ui-demo`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/ui-demo) | `media-generation` | Record polished UI demo videos using Playwright. |
| [`video-editing`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/video-editing) | `media-generation` | AI-assisted video editing workflows for cutting, structuring, and augmenting real footage. |
| [`videodb`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/videodb) | `media-generation` | Ingest, index, search, edit, and monitor video and audio with the VideoDB Python SDK — upload from files, URLs, or RTSP feeds, build spoken and scene indexes with timestamped search and playable cl... |
| [`taste`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/taste) | `media-generation` | Creative-direction layer for music videos and short-form edits in the angelcore / cloud-trance / hyperpop family — a named-genre aesthetic vocabulary, mood + color + light system, beat-synced editi... |
| [`tasteforge-video`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/tasteforge-video) | `media-generation` | Use for file-driven multimodal image, video, and 3D-asset discovery; taste interviews; distill or apply workflows; style-pack validation; editable EDL/FCPXML export; provenance audits; and offline... |
| [`taste-distillation`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/taste-distillation) | `media-generation` | Measure a set of reference videos into a reusable style pack - colour grade as a 3D LUT, cut rhythm as a shot-length distribution, hero stills, screen-blend overlay plates, and a text spec for a ge... |
| [`taste-application`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/taste-application) | `media-generation` | Generate new video against a distilled style pack and cut it into a finished piece - plan takes from the reference's cut rhythm, generate on fal, grade with the pack's measured LUT, cut at the meas... |

## Договоры и операторский документооборот

Генерация договоров, e-sign, согласования с контрагентами.

| Навык | Модуль ECC | Описание |
|---|---|---|
| [`operator-approval-loop`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/operator-approval-loop) | `operator-desk-patterns` | Operator approval contract with internal filing notices for agent-drafted outbound messages, hashed drafts, epoch-keyed decisions, durable delivery claims and receipts, and a pre-draft baseline gate. |
| [`counterparty-channel-discipline`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/counterparty-channel-discipline) | `operator-desk-patterns` | Per-channel strict prompts, mention gating, silent observation, and a communication autonomy policy for agents that sit in shared channels with external counterparties. |
| [`master-agreement-generator`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/master-agreement-generator) | `operator-desk-patterns` | Generate review drafts of counterparty master agreements from one template plus a JSON spec, with role-selected clauses and a Schedule A workflow limited to the executed agreement's notice authority. |
| [`esign-field-placement`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/esign-field-placement) | `operator-desk-patterns` | Deterministic method for placing signature, date, and text fields in a web e-signature composer through a browser automation session, using a fixed signature page, numeric Location panel coordinate... |
| [`visa-doc-translate`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/visa-doc-translate) | `document-processing` | Translate visa document images (bank deposit, employment, income, and retirement certificates; HEIC, PNG, or JPG) into English via OCR and produce a bilingual PDF pairing the original image with a... |

## Узкие исследования и редкие технологии

OSINT, патентная база, биоинформатика, баги за вознаграждение, редкие фреймворки и языки.

| Навык | Модуль ECC | Описание |
|---|---|---|
| [`osint-investigation`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/osint-investigation) | `research-apis` | Sparse-clue OSINT investigation methodology for extracting overlooked leads, connecting fragmented evidence, and testing explanations across sources. |
| [`scientific-db-uspto-database`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/scientific-db-uspto-database) | `research-apis` | USPTO patent and trademark data workflow for official record lookup, PatentSearch queries, TSDR checks, assignment data, and reproducible IP research logs. |
| [`scientific-pkg-gget`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/scientific-pkg-gget) | `research-apis` | gget CLI and Python workflow for quick genomic database queries, sequence lookup, BLAST-style searches, enrichment checks, and reproducible bioinformatics evidence logs. |
| [`security-bounty-hunter`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/security-bounty-hunter) | `security` | Hunt for exploitable, bounty-worthy security issues in repositories. |
| [`bengali-nlp`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/bengali-nlp) | `framework-language` | Bengali (Bangla) text processing patterns including Unicode normalization, script detection, tokenization, conjunct handling, and Bangla-specific NLP best practices for AI applications. |
| [`tinystruct-patterns`](https://github.com/affaan-m/ECC/tree/4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2/skills/tinystruct-patterns) | `framework-language` | Expert guidance for developing with the tinystruct Java framework. |
