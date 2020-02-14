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

let sbomCreator = new CycloneDXSbomCreator(
  process.cwd(), {
    devDependencies: true, 
    includeBomSerialNumber: true, 
    includeLicenseData: true,
    includeLicenseText: false,
  });

sbomCreator.createBom()
  .then((val) => {
    console.log(val);
  })
  .catch((err) => {
    console.error(err);
  });
