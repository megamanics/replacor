#!/usr/bin/env node

import fetch from "node-fetch";
import dotenv from 'dotenv'
import {Buffer} from 'node:buffer';
import {Command} from 'commander';

dotenv.config();

console.debug = process.env.DEBUG ? console.table : () => {
};

const options = new Command()
    .name('replace.js')
    .description('CLI to replace strings in Confluence Pages')
    .version('0.0.1')
    .requiredOption('-q, --query <query>', 'CQL query to search for, eg: text~gitlab')
    .requiredOption('-r, --replace  <string>', 'replace string eg: gitlab -> github')
    .requiredOption('-u, --user  <user>', 'user eg: your_email@domain.com')
    .requiredOption('-t, --token <token>', 'your_user_api_token with scope read:content-details:confluence,write:content:confluence')
    .requiredOption('-d, --domain <domainurl>', 'eg: https://<domain_name>.atlassian.net')
    .parse()
    .opts();

console.debug(options);

let user, token, query, domain, replacestr = "";
user = options.user ? user = options.user : user = process.env.CONFLUENCE_USER;
//user ? console.debug("USER:" + user) : console.warn("CONFLUENCE_USER not set");

token = options.token ? token = options.token : token = process.env.CONFLUENCE_TOKEN;
query = options.query;
domain = options.domain ? domain = options.domain : domain = process.env.CONFLUENCE_DOMAIN;
replacestr = options.replace;

/**
 * https://jdog.atlassian.net/gateway/api/graphql
 * query ari {
 *   tenantContexts(hostNames: ["megamanics.atlassian.net"]) {
 *     cloudId
 *   }
 * }
 * mutation MyMutation {
 *   confluence {
 *     updateCurrentPage(input: {id: ""}) {
 *       page {
 *         body {
 *           storage {
 *             value
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 */

const cloudId = "";
const PAGE_ID = "";
const graphqlConfluenceQuery = `
query page {
    confluence {
        page(
            id: "ari:cloud:confluence:${cloudId}:page:${PAGE_ID}"
        ) {
            id
            body {
                storage {
                    value
                }
            }
        }
    }
}
`;

//confluence graphql query to get all the content ids that match the search term
let SEARCH_TERM;
let LIMIT;
let START;
const graphqlConfluenceSearchQuery = `
query search {
    confluence {
        search(
            query: "${SEARCH_TERM}"
            limit: ${LIMIT}
            start: ${START}
        ) {
            results {
                id
                type
                title
                url
                space {
                    id
                    name
                }
                ancestors {
                    id
                    type
                    title
                    url
                    space {
                        id
                        name
                    }
                }
            }
        }
    }
}
`;


const searchQuery = domain + "/wiki/rest/api/content/search?cql=" + query;

const header = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ` + Buffer.from(user + `:` + token).toString('base64')
};
console.debug({"searchQuery: ": searchQuery});
console.debug(header);

fetch(searchQuery, {
    method: 'GET',
    headers: header
    //body: JSON.stringify({query: searchQuery}),
}).then(res => res.json()).then(json => {
    console.table({"Content IDs: ": json.results.map(result => result.id)});
    console.table({"Total Size: ": json.size});
    json.results.forEach(result => {
        getContent(result.id);
    });

}).catch(err => {
    console.error(err);
})

function getPageQuery(pageId) {
    return domain + "/wiki/rest/api/content/" + pageId + "?expand=body.storage,version";
}


function getContent(id) {
    fetch(getPageQuery(id), {
        method: 'GET',
        headers: header
    }).then(res => res.json())
        .then(json => {
            let content = json.body.storage.value;
            let replacedContent = content.replace(new RegExp("bitbucket", 'g'), "github");
            console.log("ID:" + id + " version:" + json.version.number + ": " + content + "\n" + replacedContent)
            return json
        }).catch(err => {
        console.error(err);
    });
};


function replaceContent(id, content) {
    fetch(getPageQuery(id), {
        method: 'PUT',
        headers: header,
        body: JSON.stringify({
            "body": {
                "storage": {
                    "value": content
                }
            }
        })
    }).then(res => res.json())
        .then(json => {
            console.log("ID:" + id + " version:" + json.version.number + ": " + content + "\n" + replacedContent)
            return json
        }).catch(err => {
        console.error(err);
    });
}

const bodyData = `{
  "version": {
    "number": $version
  },
  "type": "page",
  "body": {
    "storage": {
      "value": "$value",
      "representation": "storage"
    }
  }
}`;

/*fetch('https://$DOMAIN.atlassian.net/wiki/rest/api/content/{id}', {
    method: 'PUT',
    headers: {
        'Authorization': 'Bearer $process.env.BBTOKEN',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    body: bodyData
})
    .then(response => {
        console.log(
            `Response: ${response.status} ${response.statusText}`
        );
        return response.text();
    })
    .then(text => console.log(text))
    .catch(err => console.error(err));*/