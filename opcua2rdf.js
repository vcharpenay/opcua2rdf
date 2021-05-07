const fs = require('fs');
const cheerio = require('cheerio');

function node(n, t) {
    let nodeId = n.attr('nodeid');

    let name = n.attr('browsename');
    let nameSel = $('*|DisplayName', n);
    if (nameSel.length > 0) name = nameSel.text();

    let description = undefined;
    let descSel = $('*|Description', n);
    // TODO retrieve locale
    if (descSel.length > 0) description = descSel.text();

    let entity = {
        '@id': nodeId,
        '@type': `ua:${t}`,
        'label': name,
        'comment': description
    };

    $('*|References *|Reference', n).each((i, ref) => {
        let refType = $(ref).attr('referencetype');
        entity[`ua:${refType}`] = {
            '@id': $(ref).text()
        };
    });

    return entity;
}

const g = {
    '@context': {
        'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
        'ua': 'http://opcfoundation.org/UA/2011/03/UANodeSet.xsd#',
        'label': 'rdfs:label'
    },
    '@graph': []
};

const types = ['UAVariable', 'UAObjectType', 'UAObject']; // TODO DataTypes?

if (process.argv.length < 4) {
    console.log('Usage: node opcua2rdf.js <in.xml> <out.jsonld>');
    return;
}

const inputFilename = process.argv[2];
const outputFilename = process.argv[3];

const xml = fs.readFileSync(inputFilename, 'utf-8');

const $ = cheerio.load(xml);

g['@graph'] = types.reduce((entities, t) => {
    let e = $(`*|${t}`).toArray().map(n => node($(n), t));
    entities.push(e);
    return entities;
}, []);

fs.writeFileSync(outputFilename, JSON.stringify(g));