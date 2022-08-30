#!/usr/bin/env node

import fetch from "node-fetch";
import dotenv from 'dotenv'
import {Buffer} from 'node:buffer';
import {Command} from 'commander';

dotenv.config();

console.debug = process.env.DEBUG ? console.table : () => {
};

const options = new Command()
    .name('search.js')
    .description('CLI to search Confluence Pages')
    .version('0.0.1')
    .requiredOption('-q, --query <query>', 'CQL query to search for, eg: text~gitlab')
    .requiredOption('-u, --user  <user>', 'user eg: your_email@domain.com')
    .requiredOption('-t, --token <token>', 'your_user_api_token with scope read:content-details:confluence,write:content:confluence')
    .requiredOption('-d, --domain <domainurl>', 'eg: https://<domain_name>.atlassian.net')
    .parse()
    .opts();

console.debug(options);

let user, token, query, domain = "";
query = options.query;
user = options.user ? user = options.user : user = process.env.CONFLUENCE_USER;
token = options.token ? token = options.token : token = process.env.CONFLUENCE_TOKEN;
domain = options.domain ? domain = options.domain : domain = process.env.CONFLUENCE_DOMAIN;

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
}).then(res => res.json())
    .then(json => {
        if (json.results != null) {
            let hm = []
            json.results.forEach(result => {
                hm.push({"id": result.id, "type": result.type, "title": result.title})
            });
            json.size ? console.table(hm) : console.table({"No results matching query": query});
        } else {
            console.error(json.message);
        }
    }).catch(err => {
    console.error(err);
})
