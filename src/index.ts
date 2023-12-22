import {
    $query,
    $update,
    Record,
    StableBTreeMap,
    Vec,
    match,
    Result,
    nat64,
    ic,
    Opt,
    Principal,
} from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Define Developer type
type Developer = Record<{
    id: string;
    principal: Principal;
    username: string; // github username
    email: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>;

// Define ProgrammingLanguage type
type ProgrammingLanguage = Record<{
    id: string;
    name: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>;

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
}>;

// Define DeveloperPayload for creating/updating developerStorage
type DeveloperPayload = Record<{
    username: string;
    email: string;
}>;

// Define ProgrammingLanguagePayload for creating/updating languageStorage
type ProgrammingLanguagePayload = Record<{
    name: string;
}>;

// Define RepoPayload for creating/updating repoStorage
type RepoPayload = Record<{
    developer_id: string;
    programming_language_id: string;
    repo_name: string;
    description: string;
}>;

// Create a new StableBTreeMap to store tokens, blockchains
const developerStorage = new StableBTreeMap<string, Developer>(0, 44, 1024);
const languageStorage = new StableBTreeMap<string, ProgrammingLanguage>(1, 44, 1024);
const repoStorage = new StableBTreeMap<string, Repo>(2, 44, 1024);

$query;
// Find all developers info
export function getDevelopers(): Result<Vec<Developer>, string> {
    try {
        // Return all developers
        return Result.Ok(developerStorage.values());
    } catch (error) {
        return Result.Err(`Error retrieving developers: ${error}`);
    }
}

$query;
// Find all programming languages info
export function getLanguages(): Result<Vec<ProgrammingLanguage>, string> {
    try {
        // Return all programming languages
        return Result.Ok(languageStorage.values());
    } catch (error) {
        return Result.Err(`Error retrieving programming languages: ${error}`);
    }
}

$query;
// Find all repos info
export function getRepos(): Result<Vec<Repo>, string> {
    try {
        // Return all repos
        return Result.Ok(repoStorage.values());
    } catch (error) {
        return Result.Err(`Error retrieving repos: ${error}`);
    }
}

$query;
// Find developer by id
export function getDeveloperById(id: string): Result<Developer, string> {
    // Parameter Validation: Ensure that ID is provided
    if (!id) {
        return Result.Err<Developer, string>('Invalid ID provided.');
    }

    try {
        // Return developer by ID
        return match(developerStorage.get(id), {
            Some: (dev) => Result.Ok<Developer, string>(dev),
            None: () => Result.Err<Developer, string>(`Developer with id=${id} not found`),
        });
    } catch (error) {
        return Result.Err(`Error retrieving developer: ${error}`);
    }
}

$query;
// Find developer by github's username
export function getDeveloperByUsername(username: string): Result<Developer, string> {
    // Parameter Validation: Ensure that username is provided
    if (!username) {
        return Result.Err<Developer, string>('Invalid username provided.');
    }

    try {
        // Return developer by username
        const developers = developerStorage.values();
        for (const dev of developers) {
            if (dev.username === username) {
                return Result.Ok<Developer, string>(dev);
            }
        }
        return Result.Err<Developer, string>(`Developer with username = ${username} not found`);
    } catch (error) {
        return Result.Err(`Error retrieving developer: ${error}`);
    }
}

$query;
// Find programming language info by id
export function getLanguageById(id: string): Result<ProgrammingLanguage, string> {
    // Parameter Validation: Ensure that ID is provided
    if (!id) {
        return Result.Err<ProgrammingLanguage, string>('Invalid ID provided.');
    }

    try {
        // Return programming language by ID
        return match(languageStorage.get(id), {
            Some: (language) => Result.Ok<ProgrammingLanguage, string>(language),
            None: () => Result.Err<ProgrammingLanguage, string>(`ProgrammingLanguage with id=${id} not found`),
        });
    } catch (error) {
        return Result.Err(`Error retrieving programming language: ${error}`);
    }
}

$query;
// Find programming language info by language's name
export function getLanguageByName(name: string): Result<ProgrammingLanguage, string> {
    // Parameter Validation: Ensure that name is provided
    if (!name) {
        return Result.Err<ProgrammingLanguage, string>('Invalid name provided.');
    }

    try {
        // Return programming language by name
        const languages = languageStorage.values();
        for (const language of languages) {
            if (language.name === name) {
                return Result.Ok<ProgrammingLanguage, string>(language);
            }
        }
        return Result.Err<ProgrammingLanguage, string>(`ProgrammingLanguage with name = ${name} not found`);
    } catch (error) {
        return Result.Err(`Error retrieving programming language: ${error}`);
    }
}

$query;
// Find repo info by id
export function getRepoById(id: string): Result<Repo, string> {
    // Parameter Validation: Ensure that ID is provided
    if (!id) {
        return Result.Err<Repo, string>('Invalid ID provided.');
    }

    try {
        // Return repo by ID
        return match(repoStorage.get(id), {
            Some: (repo) => Result.Ok<Repo, string>(repo),
            None: () => Result.Err<Repo, string>(`Repo with id=${id} not found`),
        });
    } catch (error) {
        return Result.Err<Repo, string>(`Error retrieving repo: ${error}`);
    }
}

$query;
// Find all repos info by current caller
export function getMyRepos(): Result<Vec<Repo>, string> {
    try {
        // Return repos for the current caller
        const repos = repoStorage.values();
        const result: Repo[] = [];
        for (const repo of repos) {
            if (ic.caller().toString() === repo.developer.toString()) {
                result.push(repo);
            }
        }
        return Result.Ok(result);
    } catch (error) {
        return Result.Err(`Error retrieving repos: ${error}`);
    }
}

$query;
// Find all repos by programming language name
export function getReposByLanguage(languageName: string): Result<Vec<Repo>, string> {
    // Parameter Validation: Ensure that languageName is provided
    if (!languageName) {
        return Result.Err<Vec<Repo>, string>('Invalid languageName provided.');
    }

    try {
        // Return repos by programming language name
        const repos = repoStorage.values();
        let languageId: string = '';
        const languages = languageStorage.values();
        for (const language of languages) {
            if (language.name === languageName) {
                languageId = language.id;
                break;
            }
        }

        if (languageId === '') {
            return Result.Err(`Language with name ${languageName} not found`);
        }

        const result: Repo[] = [];
        for (const repo of repos) {
            if (repo.programming_language_id === languageId) {
                result.push(repo);
            }
        }
        return Result.Ok(result);
    } catch (error) {
        return Result.Err(`Error retrieving repos: ${error}`);
    }
}

$query;
// Find all repos by developer's username
export function getReposByDev(username: string): Result<Vec<Repo>, string> {
    // Parameter Validation: Ensure that username is provided
    if (!username) {
        return Result.Err<Vec<Repo>, string>('Invalid username provided.');
    }

    try {
        // Return repos by developer's username
        const repos = repoStorage.values();
        let developerId: string = '';
        const developers = developerStorage.values();
        for (const dev of developers) {
            if (dev.username === username) {
                developerId = dev.id;
                break;
            }
        }

        if (developerId === '') {
            return Result.Err(`Developer with name ${username} not found`);
        }

        const result: Repo[] = [];
        for (const repo of repos) {
            if (repo.developer_id === developerId) {
                result.push(repo);
            }
        }
        return Result.Ok(result);
    } catch (error) {
        return Result.Err(`Error retrieving repos: ${error}`);
    }
}

$update;
// Create new developer info
export function createDeveloper(payload: DeveloperPayload): Result<Developer, string> {
    try {
        // Payload Validation: Check that payload properties (username, email) are valid
        if (!payload.username || !payload.email) {
            return Result.Err<Developer, string>('Invalid payload provided.');
        }

        // Developer Existence Check: Check if a developer with the same username already exists
        const developers = developerStorage.values();
        for (const dev of developers) {
            if (dev.username === payload.username) {
                return Result.Err<Developer, string>(`Developer with username ${payload.username} already exists`);
            }
        }

        // Create new developer
        const developer: Developer = {
            id: uuidv4(), // Generate unique ID for new developer
            principal: ic.caller(),
            createdAt: ic.time(),
            updatedAt: Opt.None,
            username: payload.username,
            email: payload.email,
        };

        // Store new developer
        developerStorage.insert(developer.id, developer);
        return Result.Ok(developer);
    } catch (error) {
        return Result.Err(`Error creating developer: ${error}`);
    }
}


$update;
// Developer update his info
export function updateDeveloper(
  id: string,
  payload: DeveloperPayload
): Result<Developer, string> {
  try {
    // ID Validation: Ensure that ID is provided
    if (!id) {
      return Result.Err<Developer, string>('Invalid ID provided.');
    }

    // Payload Validation: Check that payload properties (username, email) are valid
    if (!payload.username || !payload.email) {
      return Result.Err<Developer, string>('Invalid payload provided.');
    }

    return match(developerStorage.get(id), {
      Some: (existingDeveloper) => {
        // Authorization Check: Confirm only the developer can update his info
        if (ic.caller().toString() !== existingDeveloper.principal.toString()) {
          return Result.Err<Developer, string>(
            `You are not authorized to update the developer info.`
          );
        }

        // Update existing developer
        const updatedDeveloper: Developer = {
          ...existingDeveloper,
          ...payload,
          updatedAt: Opt.Some(ic.time()), // Set the update timestamp to the current time
        };
        developerStorage.insert(existingDeveloper.id, updatedDeveloper);
        return Result.Ok<Developer, string>(updatedDeveloper);
      },
      None: () => Result.Err<Developer, string>(`Developer with id=${id} not found.`),
    });
  } catch (error) {
    return Result.Err(`Error updating developer: ${error}`);
  }
}

$update;
// Create new programming language
export function createLanguage(
    payload: ProgrammingLanguagePayload
): Result<ProgrammingLanguage, string> {
    try {
        // Payload Validation: Check that payload properties (name) are valid
        if (!payload.name) {
            return Result.Err<ProgrammingLanguage, string>('Invalid payload provided.');
        }

        // Language Existence Check: Check if a programming language with the same name already exists
        const languages = languageStorage.values();
        for (const lang of languages) {
            if (lang.name === payload.name) {
                return Result.Err<ProgrammingLanguage, string>(`ProgrammingLanguage already exists`);
            }
        }

        // Create new programming language
        const language: ProgrammingLanguage = {
            id: uuidv4(), // Generate unique ID for new language
            createdAt: ic.time(),
            updatedAt: Opt.None,
            name: payload.name,
        };

        // Store new language
        languageStorage.insert(language.id, language);
        return Result.Ok(language);
    } catch (error) {
        return Result.Err(`Error creating programming language: ${error}`);
    }
}


$update;
// Developer create new repository
export function createRepo(
    developer_id: string,
    programming_language_id: string,
    repo_name: string,
    description: string
): Result<Repo, string> {
    try {
        // Validate parameters
        if (!developer_id || !programming_language_id || !repo_name || !description) {
            return Result.Err<Repo, string>("Invalid parameters provided for creating a repo.");
        }

        const repo: Repo = {
            id: uuidv4(),
            developer: ic.caller(),
            createdAt: ic.time(),
            updatedAt: Opt.None,
            developer_id,
            programming_language_id,
            repo_name,
            description,
        };

        // Check if repo's name already exists
        const existingRepo = repoStorage.values().find((r) => r.repo_name === repo.repo_name);
        if (existingRepo) {
            return Result.Err<Repo, string>("Repo already exists with the provided name.");
        }

        repoStorage.insert(repo.id, repo);
        return Result.Ok(repo);
    } catch (error) {
        return Result.Err(`Error creating a repo: ${error}`);
    }
}



$update;
// Developer update his repo
export function updateRepo(
  id: string,
  developer_id: string,
  programming_language_id: string,
  repo_name: string,
  description: string
): Result<Repo, string> {
  try {
    // Validate parameters
    if (!id || !developer_id || !programming_language_id || !repo_name || !description) {
      return Result.Err<Repo, string>("Invalid parameters provided for updating a repo.");
    }

    return match(repoStorage.get(id), {
      Some: (repoToUpdate) => {
        // Confirm only the developer of the repo can call this function
        if (ic.caller().toString() !== repoToUpdate.developer.toString()) {
          return Result.Err<Repo, string>(`You are not authorized to update the repo.`);
        }

        const updatedRepo: Repo = {
          ...repoToUpdate,
          updatedAt: Opt.Some(ic.time()),
          developer_id,
          programming_language_id,
          repo_name,
          description,
        };

        repoStorage.insert(id, updatedRepo);
        return Result.Ok<Repo, string>(updatedRepo);
      },
      None: () => Result.Err<Repo, string>(`Repo with id=${id} not found.`),
    });
  } catch (error) {
    return Result.Err(`Error updating a repo: ${error}`);
  }
}

$update;
// Developer delete his repository
export function deleteRepo(id: string): Result<string, string> {
    return match(repoStorage.get(id), {
        Some: (repo: Repo) => {
            // Confirm only developer of the repo can call this function
            if (ic.caller().toString() !== repo.developer.toString()) {
                return Result.Err<string, string>(
                    `You are not authorized to delete the repo.`
                );
            }

            repoStorage.remove(id); // Remove the repo from the repoStorage
            return Result.Ok<string, string>(`Repo deleted successfully.`);
        },
        None: () => {
            return Result.Err<string, string>(
                `couldn't delete a repo with id=${id}. repo not found`
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