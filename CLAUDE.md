# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Microsite that compares countries to California by population, GDP, GDP per capita, and land area. Runs on Cloudflare Workers, deployed to two domains:
- biggerthancali.org - implies the country is bigger
- smallerthancali.org - implies the country is smaller

The text color (green/red) indicates whether the domain's implication matches reality.

## Commands

- `bun run dev` - Start local dev server via Wrangler
- `bun run deploy` - Deploy to Cloudflare Workers
- `bun run fetch-data` - Refresh country data from World Bank, Census Bureau, and FRED APIs

## Architecture

**Worker entry point:** `src/index.ts` - Cloudflare Worker fetch handler that routes requests based on path and hostname.

**Data layer:** `src/data.ts` - Loads country data from `src/data/countries.json`, provides lookup by name with case-insensitive matching and country aliases (e.g., "usa" → "united states").

**Templates:** `src/template.ts` - Generates HTML for home page, comparison pages, and 404. All HTML is rendered server-side.

**Data script:** `scripts/fetch-data.ts` - Bun script that fetches data from World Bank API (countries) and FRED/Census (California) and writes to `src/data/countries.json`.

## Key Patterns

- Country names in URLs can use either official World Bank names or common aliases defined in `data.ts`
- Display names (shown to users) are mapped from official names in `getDisplayName()`
- The comparison verdict is based solely on population (not GDP or area)
