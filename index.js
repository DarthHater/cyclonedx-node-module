const readInstalled = require('read-installed');
const parsePackageJsonName = require('parse-packagejson-name');
const ssri = require('ssri');
const spdxLicenses = require('./spdx-licenses.json');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const PackageURL = require('packageurl-js');
const builder = require('xmlbuilder');

/**
 * Performs a lookup + validation of the license specified in the
 * package. If the license is a valid SPDX license ID, set the 'id'
 * of the license object, otherwise, set the 'name' of the license
 * object.
 */
function getLicenses(pkg) {
    let license = pkg.license && (pkg.license.type || pkg.license);
    if (license) {
        if (!Array.isArray(license)) {
            license = [license];
        }
        return license.map(l => {
            if (! (typeof l === 'string' || l instanceof String)) {
                console.error("Invalid license definition in package: " + pkg.name + ":" + pkg.version + ". Skipping");
                return null;
            }
            let licenseContent = {};
            if (spdxLicenses.some(v => { return l === v; })) {
                licenseContent.id = l;
            } else {
                licenseContent.name = l;
            }
            addLicenseText(pkg, l, licenseContent);
            return licenseContent;
        }).map(l => ({license: l}));
    }
    return null;
}

/**
 * Tries to find a file containing the license text based on commonly
 * used naming and content types. If a candidate file is found, add
 * the text to the license text object and stop.
 */
function addLicenseText(pkg, l, licenseContent) {
    let licenseFilenames = [ 'LICENSE', 'License', 'license', 'LICENCE', 'Licence', 'licence', 'NOTICE', 'Notice', 'notice' ];
    let licenseContentTypes = { 'text/plain': '', 'text/txt': '.txt', 'text/markdown': '.md', 'text/xml': '.xml' };
    /* Loops over different name combinations starting from the license specified
       naming (e.g., 'LICENSE.Apache-2.0') and proceeding towards more generic names. */
    for (const licenseName of [`.${l}`, '']) {
        for (const licenseFilename of licenseFilenames) {
            for (const [licenseContentType, fileExtension] of Object.entries(licenseContentTypes)) {
                let licenseFilepath = `${pkg.realPath}/${licenseFilename}${licenseName}${fileExtension}`;
                if (fs.existsSync(licenseFilepath)) {
                    licenseContent.text = readLicenseText(licenseFilepath, licenseContentType);
                    return;
                }
            }
        }
    }
}

/**
 * Read the file from the given path to the license text object and includes
 * content-type attribute, if not default. Returns the license text object.
 */
function readLicenseText(licenseFilepath, licenseContentType) {
    let licenseText = fs.readFileSync(licenseFilepath, 'utf8');
    if (licenseText) {
        let licenseContentText = { '#cdata' : licenseText };
        if (licenseContentType !== 'text/plain') {
            licenseContentText['@content-type'] = licenseContentType;
        }
        return licenseContentText;
    }
    return null;
}

/**
 * Adds external references supported by the package format.
 */
function addExternalReferences(pkg) {
    let externalReferences = [];
    if (pkg.homepage) {
        externalReferences.push({'reference': {'@type': 'website', url: pkg.homepage}});
    }
    if (pkg.bugs && pkg.bugs.url) {
        externalReferences.push({'reference': {'@type': 'issue-tracker', url: pkg.bugs.url}});
    }
    if (pkg.repository && pkg.repository.url) {
        externalReferences.push({'reference': {'@type': 'vcs', url: pkg.repository.url}});
    }
    return externalReferences;
}

/**
 * For all modules in the specified package, creates a list of
 * component objects from each one.
 */
exports.listComponents = listComponents;
function listComponents(pkg) {
    let list = {};
    let isRootPkg = true;
    addComponent(pkg, list, isRootPkg);
    return Object.keys(list).map(k => ({ component: list[k] }));
}

/**
 * Given the specified package, create a CycloneDX component and add it to the list.
 */
function addComponent(pkg, list, isRootPkg = false) {
    //read-installed with default options marks devDependencies as extraneous
    //if a package is marked as extraneous, do not include it as a component
    if(pkg.extraneous) return;
    if(!isRootPkg) {
        let pkgIdentifier = parsePackageJsonName(pkg.name);
        let group = pkgIdentifier.scope;
        let name = pkgIdentifier.fullName;
        let version = pkg.version;
        let licenses = getLicenses(pkg);
        let purl = new PackageURL('npm', pkgIdentifier.scope, pkg.name, pkg.version, null, null);
        let purlString = purl.toString();
        let component = {
            '@type'            : determinePackageType(pkg),
            '@bom-ref'         : purlString,
            group              : group,
            name               : name,
            version            : version,
            description        : { '#cdata' : pkg.description },
            hashes             : [],
            licenses           : licenses,
            purl               : purlString,
            externalReferences : addExternalReferences(pkg)
        };

        if (component.externalReferences === undefined || component.externalReferences.length === 0) {
            delete component.externalReferences;
        }

        processHashes(pkg, component);

        if (list[component.purl]) return; //remove cycles
        list[component.purl] = component;
    }
    if (pkg.dependencies) {
        Object.keys(pkg.dependencies)
            .map(x => pkg.dependencies[x])
            .filter(x => typeof(x) !== 'string') //remove cycles
            .map(x => addComponent(x, list));
    }
}

/**
 * If the author has described the module as a 'framework', the take their
 * word for it, otherwise, identify the module as a 'library'.
 */
function determinePackageType(pkg) {
    if (pkg.hasOwnProperty('keywords')) {
        for (keyword of pkg.keywords) {
            if (keyword.toLowerCase() === 'framework') {
                return 'framework';
            }
        }
    }
    return 'library';
}

/**
 * Uses the SHA1 shasum (if present) otherwise utilizes Subresource Integrity
 * of the package with support for multiple hashing algorithms.
 */
function processHashes(pkg, component) {
    if (pkg._shasum) {
        component.hashes.push({ hash: { '@alg':'SHA-1', '#text': pkg._shasum} });
    } else if (pkg._integrity) {
        let integrity = ssri.parse(pkg._integrity);
        // Components may have multiple hashes with various lengths. Check each one
        // that is supported by the CycloneDX specification.
        if (integrity.hasOwnProperty('sha512')) {
            addComponentHash('SHA-512', integrity.sha512[0].digest, component);
        }
        if (integrity.hasOwnProperty('sha384')) {
            addComponentHash('SHA-384', integrity.sha384[0].digest, component);
        }
        if (integrity.hasOwnProperty('sha256')) {
            addComponentHash('SHA-256', integrity.sha256[0].digest, component);
        }
        if (integrity.hasOwnProperty('sha1')) {
            addComponentHash('SHA-1', integrity.sha1[0].digest, component);
        }
    }
    if (component.hashes.length === 0) {
        delete component.hashes; // If no hashes exist, delete the hashes node (it's optional)
    }
}

/**
 * Adds a hash to component.
 */
function addComponentHash(alg, digest, component) {
    let hash = Buffer.from(digest, 'base64').toString('hex');
    component.hashes.push({hash: {'@alg': alg, '#text': hash}});
}

exports.createbom = (includeBomSerialNumber, path, options, callback) => readInstalled(path, options, (err, pkgInfo) => {
    let bom = builder.create('bom', { encoding: 'utf-8', separateArrayItems: true })
        .att('xmlns', 'http://cyclonedx.org/schema/bom/1.1');
    if (includeBomSerialNumber) {
        bom.att('serialNumber', 'urn:uuid:' + uuidv4());
    }
    bom.att('version', 1);
    let componentsNode = bom.ele('components');
    let components = listComponents(pkgInfo);
    if (components.length > 0) {
        componentsNode.ele(components);
    }
    let bomString = bom.end({
        pretty: true,
        indent: '  ',
        newline: '\n',
        width: 0,
        allowEmpty: false,
        spacebeforeslash: ''
    });
    callback(null, bomString);
});
