import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt, Principal } from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Define Developer type
type Developer = Record<{
    id: string;
    principal: Principal;
    username: string; // github username
    email: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

// Define ProgrammingLanguage type
type ProgrammingLanguage = Record<{
    id: string;
    name: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

// Define Repo type
type Repo = Record<{
    id: string;
    developer_id: string;
    developer: Principal;
    programming_language_id: string;
    repo_name: string;
    description: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

// Define DeveloperPayload for creating/updating developerStorage
type DeveloperPayload = Record<{
    username: string;
    email: string;
}>

// Define ProgrammingLanguagePayload for creating/updating languageStorage
type ProgrammingLanguagePayload = Record<{
    name: string;
}>

// Define RepoPayload for creating/updating repoStorage
type RepoPayload = Record<{
    developer_id: string;
    programming_language_id: string;
    repo_name: string;
    description: string;
}>

// Create a new StableBTreeMap to store tokens, blockchains
const developerStorage = new StableBTreeMap<string, Developer>(0, 44, 1024);
const languageStorage = new StableBTreeMap<string, ProgrammingLanguage>(1, 44, 1024);
const repoStorage = new StableBTreeMap<string, Repo>(2, 44, 1024);
const developersMap = new Map<string, Developer>();
const developers = developerStorage.values();
for (const dev of developers) {
    developersMap.set(dev.username, dev);
}

$query;
// Find all developers info
export function getDevelopers(): Result<Vec<Developer>, string> {
    return Result.Ok(developerStorage.values());
}

$query;
// Find all programming languages info
export function getLanguages(): Result<Vec<ProgrammingLanguage>, string> {
    return Result.Ok(languageStorage.values());
}

$query;
// Find all repos info
export function getRepos(): Result<Vec<Repo>, string> {
    return Result.Ok(repoStorage.values());
}

$query;
// Find developer by id
export function getDeveloperById(id: string): Result<Developer, string> {
    return match(developerStorage.get(id), {
        Some: (dev) => Result.Ok<Developer, string>(dev),
        None: () => Result.Err<Developer, string>(`developer with id=${id} not found`)
    });
}

$query;
// Find developer by github's username
export function getDeveloperByUsername(username: string): Result<Developer, string> {
    const developer = developersMap.get(username);
    return developer
        ? Result.Ok<Developer, string>(developer)
        : Result.Err<Developer, string>(`Developer with username=${username} not found`);
}

$query;
// Find programming language info by id
export function getLanguageById(id: string): Result<ProgrammingLanguage, string> {
    return match(languageStorage.get(id), {
        Some: (language) => Result.Ok<ProgrammingLanguage, string>(language),
        None: () => Result.Err<ProgrammingLanguage, string>(`ProgrammingLanguage with id=${id} not found`)
    });
}

$query;
// Find programming language info by language's name
export function getLanguageByName(name: string): Result<ProgrammingLanguage, string> {
    const languages = languageStorage.values();
    for (const language of languages) {
        if (language.name == name) {
            return Result.Ok<ProgrammingLanguage, string>(language);
        }
    }
    return Result.Err<ProgrammingLanguage, string>(`ProgrammingLanguage with name = ${name} not found`);
}

$query;
// Find repo info by id
export function getRepoById(id: string): Result<Repo, string> {
    return match(repoStorage.get(id), {
        Some: (repo) => Result.Ok<Repo, string>(repo),
        None: () => Result.Err<Repo, string>(`Repo with id=${id} not found`)
    });
}

$query;
// Find all repos info by current caller
export function getMyRepos(): Result<Vec<Repo>, string> {
    const repos = repoStorage.values();
    let result: Repo[] = [];
    for (const repo of repos) {
        if (ic.caller().toString() === repo.developer.toString()) {
            result.push(repo);
        }
    }
    return Result.Ok(result);
}

$query;
// Find all repos by programming language name
export function getReposByLanguage(languageName: string): Result<Vec<Repo>, string> {
    const repos = repoStorage.values();
    let languageId: string = '';
    const languages = languageStorage.values();
    for (const language of languages) {
        if (language.name == languageName) {
            languageId = language.id;
            break;
        }
    }

    if (languageId == '') {
        return Result.Err(`language with name ${languageName} not found`);
    }

    let result: Repo[] = [];
    for (const repo of repos) {
        if (repo.programming_language_id === languageId) {
            result.push(repo);
        }
    }
    return Result.Ok(result);
}

$query;
// Find all repos by developer's username
export function getReposByDev(username: string): Result<Vec<Repo>, string> {
    const repos = repoStorage.values();
    let developerId: string = '';
    const developers = developerStorage.values();
    for (const dev of developers) {
        if (dev.username == username) {
            developerId = dev.id;
            break;
        }
    }

    if (developerId == '') {
        return Result.Err(`developer with name ${username} not found`);
    }

    let result: Repo[] = [];
    for (const repo of repos) {
        if (repo.developer_id === developerId) {
            result.push(repo);
        }
    }
    return Result.Ok(result);
}

$update;
// Create new developer info
export function createDeveloper(payload: DeveloperPayload): Result<Developer, string> {
    // Validate email format
    if (!isValidEmail(payload.email)) {
        return Result.Err<Developer, string>(`Invalid email format`);
    }

    const developer: Developer = {
        id: uuidv4(),
        principal: ic.caller(),
        createdAt: ic.time(),
        updatedAt: Opt.None,
        ...payload,
    };
// Revert if developer already exists
    const developers = developerStorage.values();
    for (const existingDeveloper of developers) {
        if (existingDeveloper.username === payload.username) {
            return Result.Err<Developer, string>(`Developer already exists`);
        }
    }

    developerStorage.insert(developer.id, developer); // Store new developer
    return Result.Ok(developer);
}



$update;
// Developer update his info
export function updateDeveloper(
    id: string,
    payload: DeveloperPayload
): Result<Developer, string> {
    return match(developerStorage.get(id), {
        Some: (developer: Developer) => {
            // Confirm only the developer can update his info
            if (ic.caller().toString() != developer.principal.toString()) {
                return Result.Err<Developer, string>(
                    `You are not authorized to update the developer info.`
                );
            }
             // Update in updateDeveloper function
            if (ic.canisterPrincipal() !== developer.principal) {
               return Result.Err<Developer, string>(
                  `You are not authorized to update the developer info.`
             );
}


            const updatedDeveloper: Developer = {
                ...developer,
                ...payload,
                updatedAt: Opt.Some(ic.time()), // Set the update timestamp to the current time
            };
            developerStorage.insert(developer.id, updatedDeveloper); // Update the developer in the developerStorage
            return Result.Ok<Developer, string>(updatedDeveloper);
        },
        None: () =>
            Result.Err<Developer, string>(
                `Couldn't update a developer with id=${id}. Developer not found.`
            ),
    });
}

$update;
// Create new programming language
export function createLanguage(payload: ProgrammingLanguagePayload): Result<ProgrammingLanguage, string> {
    const language: ProgrammingLanguage = {
        id: uuidv4(), // Generate unique ID for new language
        createdAt: ic.time(),
        updatedAt: Opt.None,
        ...payload,
    };

    // revert if language already exist
    const languages = languageStorage.values();
    for (const lang of languages) {
        if (language.name == lang.name) {
            return Result.Err<ProgrammingLanguage, string>(`ProgrammingLanguage already exist`);
        }
    }
    languageStorage.insert(language.id, language); // store new language
    return Result.Ok(language);
}

$update;
// Developer create new repository
export function createRepo(payload: RepoPayload): Result<Repo, string> {

    const repo: Repo = {
        id: uuidv4(),
        developer: ic.caller(),
        createdAt: ic.time(),
        updatedAt: Opt.None,
        ...payload,
    }

    // revert if repo's name already exist
    const repos = repoStorage.values();
    for (const repo of repos) {
        if (repo.repo_name == payload.repo_name) {
            return Result.Err<Repo, string>(`Repo already exist`);
        }
    }

    repoStorage.insert(repo.id, repo);
    return Result.Ok(repo);
}

$update;
// Developer update his repo
export function updateRepo(id: string, payload: RepoPayload): Result<Repo, string> {
    return match(repoStorage.get(id), {
        Some: (repo: Repo) => {
            // Confirm only developer of the repo can call this function
            if (ic.caller().toString() !== repo.developer.toString()) {
                return Result.Err<Repo, string>(
                    `You are not authorized to delete the repo.`
                );
            }

            const updatedRepo: Repo = {
                ...repo,
                ...payload,
                updatedAt: Opt.Some(ic.time()), // Set the update timestamp to the current time
            };

            repoStorage.insert(repo.id, updatedRepo); // Update the repo in the repoStorage
            return Result.Ok<Repo, string>(updatedRepo);
        },
        None: () =>
            Result.Err<Repo, string>(
                `Couldn't update a repo with id=${id}. Repo not found.`
            ),
    });
}

$update;
// Developer delete his repository
// Consistent and Secure Principal Usage
export function deleteRepo(id: string): Result<string, string> {
    return match(repoStorage.get(id), {
        Some: (repo: Repo) => {
            // Confirm only the developer of the repo can call this function
            if (ic.canisterPrincipal().toString() !== repo.developer.toString()) {
                return Result.Err<string, string>(
                    `You are not authorized to delete the repo.`
                );
            }

            repoStorage.remove(id); // Remove the repo from the repoStorage
            return Result.Ok<string, string>(`Repo deleted successfully.`);
        },
        None: () => {
            return Result.Err<string, string>(
                `Couldn't delete a repo with id=${id}. Repo not found`
            );
        },
    });
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    },
};
