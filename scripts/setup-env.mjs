import { copyFile, constants } from 'node:fs/promises';

// Local setup only. Host environments should inject variables directly.
try {
  for (const name of ['server', 'client']) {
    const directory = new URL(`../config/${name}/`, import.meta.url);
    try {
      await copyFile(
        new URL('.env.example', directory),
        new URL('.env', directory),
        constants.COPYFILE_EXCL,
      );
      console.log(`Created config/${name}/.env. Replace placeholder values before starting.`);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      console.log(`Kept existing config/${name}/.env.`);
    }
  }
} catch {
  console.error(
    'Environment setup failed. Check access to the config directory. Existing files were not overwritten.',
  );
  process.exitCode = 1;
}
