#!/usr/bin/env node

import fetch from "node-fetch";
import dotenv from 'dotenv'
import {Buffer} from 'node:buffer';
import {Command} from 'commander';
import log4js from 'log4js';

let logger = log4js.getLogger();
process.env.LOGLEVEL ? logger.level = process.env.LOGLEVEL : logger.level = 'info';

dotenv.config();

const options = new Command()
    .name('replace.js')
    .description('CLI to replace strings in Confluence Pages')
    .version('0.0.1')
    .requiredOption('-q, --query <query>', 'CQL query used to search pages, eg: text~gitlab')
    .requiredOption('-s, --search  <string>', 'string to replace eg: gitlab')
    .requiredOption('-r, --replace  <string>', 'replacement string eg: gitlab -> github')
    .requiredOption('-u, --user  <user>', 'user eg: your_email@domain.com')
    .requiredOption('-t, --token <token>', 'your_user_api_token with scope read:content-details:confluence,write:content:confluence')
    .requiredOption('-d, --domain <domainurl>', 'eg: https://<domain_name>.atlassian.net')
    .parse()
    .opts();

logger.debug(options);

let user, token, query, domain, search, replacestr = "";
replacestr = options.replace;
query = options.query;
search = options.search;
user = options.user ? user = options.user : user = process.env.CONFLUENCE_USER;
token = options.token ? token = options.token : token = process.env.CONFLUENCE_TOKEN;
domain = options.domain ? domain = options.domain : domain = process.env.CONFLUENCE_DOMAIN;

const searchQuery = domain + "/wiki/rest/api/content/search?cql=" + query;

const header = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ` + Buffer.from(user + `:` + token).toString('base64')
};
logger.debug({"searchQuery: ": searchQuery});
logger.debug(header);

fetch(searchQuery, {
    method: 'GET',
    headers: header
}).then(res => res.json()).then(json => {
    logger.debug({"Content IDs: ": json.results.map(result => result.id)});
    json.size ? console.table({"Total Pages: ": json.size}) : console.table({"No results matching query": query});
    json.results.forEach(result => {
        getContent(result.id);
    });
}).catch(err => {
    console.error(err);
})

function getPageQuery(pageId) {
    return domain + "/wiki/rest/api/content/" + pageId + "?expand=body.storage,version";
}

function getPageUpdateQuery(pageId) {
    return domain + "/wiki/rest/api/content/" + pageId;
}

function getContent(id) {
    fetch(getPageQuery(id), {
        method: 'GET',
        headers: header
    }).then(res => res.json())
        .then(json => {
            let content = json.body.storage.value;
            let title = json.title;
            let type = json.type;
            let replacedContent = content.replace(new RegExp(search, 'ig'), replacestr);
            let titleReplaced = title.replace(new RegExp(search, 'ig'), replacestr);
            replaceContent(id, json.version.number + 1, type, titleReplaced, JSON.stringify(replacedContent));
        }).catch(err => {
        console.error(err);
    });
};

function replaceContent(id, version, type, title, content) {
    let bodyData = `{
        "version": {
            "number": ${version}
        },
        "type": "${type}",
        "title":  "${title}",
        "body": {
            "storage": {
                "value": ${content},
                "representation": "storage"
            }
        }
    }`;
    logger.debug(bodyData.toString());
    fetch(getPageUpdateQuery(id), {
        method: 'PUT',
        headers: header,
        body: bodyData
    }).then(res => res.json())
        .then(json => {
            json.data ? console.log(json.data.errors) : console.table({
                "id": json.id,
                "type": json.type,
                "version": json.version.number,
                "title": json.title
            })
        }).catch(err => {
        console.error(err);
    });
};