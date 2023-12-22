# Github repositories manage canister on ICP

### Features

- Create new developer info
- Create new programming language info
- Developer create new repositories
- Developer update his repository by repo's ID
- Developer delete his repository by repo's ID
- View features

### Deployment
```bash
dfx start --background --clean
dfx deploy
```

### Sample calls

#### Create new developer profile
```bash
dfx canister call repo_manage createDeveloper '(record{"username"="dacade"; "email"="dacade@gmail.com"})'
```

#### Update developer profile
```bash
dfx canister call repo_manage updateDeveloper '("1c58128d-ac03-4c43-80dc-2df09a7855d6", record{"username"="dacade"; "email"="updated email"})'
```

#### Create new programming language
```bash
dfx canister call repo_manage createLanguage '(record{"name"="Rust"})'
```

#### Create new repository
```bash
dfx canister call repo_manage createRepo '(record{"developer_id"="1c58128d-ac03-4c43-80dc-2df09a7855d6"; "programming_language_id"="47379097-75c2-485c-a846-0aaf2b894990"; "repo_name"="dacade repository"; "description"="repo desc"})'
```

#### Update repository
```bash
dfx canister call repo_manage updateRepo '("80e5d128-e8f8-4e83-a9ce-b6d7e485aa28", record{"developer_id"="1c58128d-ac03-4c43-80dc-2df09a7855d6"; "programming_language_id"="47379097-75c2-485c-a846-0aaf2b894990"; "repo_name"="dacade repository updated"; "description"="repo desc updated"})'
```

#### Delete repository
```bash
dfx canister call repo_manage deleteRepo '("80e5d128-e8f8-4e83-a9ce-b6d7e485aa28")'
```

#### Find all developers
```bash
dfx canister call repo_manage getDevelopers '()'
```

#### Find developer by developer id
```bash
dfx canister call repo_manage getDeveloperById '("1c58128d-ac03-4c43-80dc-2df09a7855d6")'
```

#### Find developer by developer username
```bash
dfx canister call repo_manage getDeveloperByUsername '("dacade")'
```

#### Find all programming languages
```bash
dfx canister call repo_manage getLanguages '()'
```

#### Find programming language by id
```bash
dfx canister call repo_manage getLanguageById '("47379097-75c2-485c-a846-0aaf2b894990")'
```

#### Find programming language by name
```bash
dfx canister call repo_manage getLanguageByName '("Rust")'
```

#### Find all repos
```bash
dfx canister call repo_manage getRepos '()'
```

#### Find repo by repo id
```bash
dfx canister call repo_manage getRepoById '("80e5d128-e8f8-4e83-a9ce-b6d7e485aa28")'
```

#### Find repos by current caller
```bash
dfx canister call repo_manage getMyRepos '()'
```

#### Find repos by programming language name
```bash
dfx canister call repo_manage getReposByLanguage '("Rust")'
```

#### Find repos by developer username
```bash
dfx canister call repo_manage getReposByDev '("dacade")'
```

## Stop dfx
```bash
dfx stop
```