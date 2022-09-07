# Pre-Reqs

* [Install node.js](https://nodejs.org/en/)
* [API Token with scope read:content-details:confluence,write:content:confluence](https://id.atlassian.com/manage/api-tokens)


# Setup
```
npm install
```

CLI options
```
./search.js -h                                                                                                                                                           
Usage: search.js [options]

CLI to search Confluence Pages

Options:
  -V, --version             output the version number
  -q, --query <query>       CQL query to search for, eg: text~gitlab
  -u, --user  <user>        user eg: your_email@domain.com
  -t, --token <token>       your_user_api_token with scope read:content-details:confluence,write:content:confluence
  -d, --domain <domainurl>  eg: https://<domain_name>.atlassian.net
  -h, --help                display help for command
```

example of an execution
```
./search.js -u $CONFLUENCE_USER -t $CONFLUENCE_TOKEN -d $CONFLUENCE_DOMAIN -q text~bitbucket.com                                                                       
```

# Reference
https://developer.atlassian.com/server/confluence/advanced-searching-using-cql
https://developer.atlassian.com/server/confluence/performing-text-searches-using-cql
