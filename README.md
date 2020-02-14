[![Build Status](https://github.com/CycloneDX/cyclonedx-node-module/workflows/Node%20CI/badge.svg)](https://github.com/CycloneDX/cyclonedx-node-module/actions?workflow=Node+CI)
[![License](https://img.shields.io/badge/license-Apache%202.0-brightgreen.svg)][License]
[![Latest](
https://img.shields.io/npm/v/@cyclonedx/bom)](https://www.npmjs.com/package/@cyclonedx/bom)
[![Website](https://img.shields.io/badge/https://-cyclonedx.org-blue.svg)](https://cyclonedx.org/)
[![Group Discussion](https://img.shields.io/badge/discussion-groups.io-blue.svg)](https://groups.io/g/CycloneDX)
[![Twitter](https://img.shields.io/twitter/url/http/shields.io.svg?style=social&label=Follow)](https://twitter.com/CycloneDX_Spec)

# CycloneDX Node.js Module
=========

The CycloneDX module for Node.js creates a valid CycloneDX Software Bill-of-Materials (SBOM) containing an aggregate of all project dependencies. CycloneDX is a lightweight SBOM specification that is easily created, human and machine readable, and simple to parse.

## Requirements
-------------------
Node.js v8.0.0 or higher

## Development

As mentioned you'll need nodejs v8.0.0 or higher

- `npm i`
- `npm run build`

From there you can:

- Debug using VS Code via the provided launch.json, set your breakpoints in TypeScript code and debug to your hearts desire
- Run the app via `npm run start`, providing commands and options shown in usage below

## Usage

`cyclonedx-bom` can be run a number of ways:

- `npx @cyclonedx/bom generate`

Usage via npx is preferred as installing globally is generally frowned upon in the node community.

- `npm i -G @cyclonedx/bom`

If you install globally, you may then call `cyclonedx-bom` with options as shown below:

```bash
$ cyclonedx-bom
cyclonedx-bom [command]

Commands:
  cyclonedx-bom generate [options]  Generate a CycloneDX SBOM

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

```bash
$ cyclonedx-bom generate --help
cyclonedx-bom generate [options]

Generate a CycloneDX SBOM

Options:
  --version                      Show version number                   [boolean]
  --help                         Show help                             [boolean]
  --include-serial-number, --ns  Do not generate bom serial number     [boolean]
  --dev, -d                      Include Development Dependencies      [boolean]
  --exclude-license-data, --nl   Exclude License Data                  [boolean]
  --exclude-license-text, --nlt  Exclude License Text                  [boolean]
```

## Example

### Generate a bom.xml file
```bash
cyclonedx-bom generate > bom.xml
```

### Output to stdout
```bash
cyclonedx-bom generate
```

### Generate sbom without license data
This is provided as a convenience, as older npm packages do not meet SPDX standards, and this gives you the option to exclude license data altogether if it suits your use case.

```bash
cyclonedx-bom generate --exclude-license-data
```

### Generate sbom with dev dependencies
By default, `cyclonedx-bom` will not include devDependencies from a package.json (and associated transitive dependencies). This will include all of them.

```bash
cyclonedx-bom generate --dev
```

### Generate sbom without license text
This is provided as a convenience, as license text can bloat the size of an sbom significantly.

```bash
cyclonedx-bom generate --exclude-license-text
```

## Programmatic usage
This project is written in TypeScript, and examples are shown in such:

```typescript
import { CycloneDXSbomCreator } from '@cyclonedx/bom';

const sbomCreator = new CycloneDXSbomCreator(
  process.cwd(), {
    devDependencies: true, 
    includeBomSerialNumber: true, 
    includeLicenseData: true,
    includeLicenseText: true,
  });

sbomCreator.createBom()
  .then((val) => {
    console.log(val);
  })
  .catch((err) => {
    console.error(err);
  });
```

## License
-------------------

Permission to modify and redistribute is granted under the terms of the Apache 2.0 license. 
See the [LICENSE](https://github.com/CycloneDX/cyclonedx-node-module/blob/master/LICENSE) file for the full license.
