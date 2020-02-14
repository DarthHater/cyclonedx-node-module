/*
 * Copyright (c) 2020-present Erlend Oftedal, Steve Springett, Sonatype, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { CycloneDXSbomCreator } from "./CycloneDXSbomCreator/CycloneDXSbomCreator";
import yargs, { Argv } from 'yargs';

let argv = yargs
  .help()
  .scriptName('cyclonedx-bom')
  .command(
    'generate [options]',
    'Generate a CycloneDX SBOM',
    (y: Argv) => {
      return y.options({
        'include-serial-number': {
          alias: "ns",
          type: "boolean",
          demandOption: false,
          description: "Do not generate bom serial number"
        },
        dev: {
          alias: "d",
          type: "boolean",
          description: "Include Development Dependencies",
          demandOption: false
        },
        'exclude-license-data': {
          alias: "nl",
          type: "boolean",
          description: "Exclude License Data",
          demandOption: false
        },
        'exclude-license-text': {
          alias: "nlt",
          type: "boolean",
          description: "Exclude License Text",
          demandOption: false
        }
      })
    }
  )
  .argv;


if (argv) {
  if (argv._[0] == 'generate') {
    let sbomCreator = new CycloneDXSbomCreator(
      process.cwd(), {
        devDependencies: (argv.dev) ? true : false, 
        includeBomSerialNumber: (argv["include-serial-number"]) ? true : false, 
        includeLicenseData: (argv["exclude-license-data"]) ? false : true,
        includeLicenseText: (argv["exclude-license-text"]) ? false : true,
      });
    
    sbomCreator.createBom()
      .then((val) => {
        console.log(val);
      })
      .catch((err) => {
        console.error(err);
      });
  } else {
    yargs.showHelp();
    process.exit(0);
  }
}

