import httpClient from '../../../services/httpClient.js';
import { assertSessionStorageAvailable, saveCaseToken } from '../../../services/sessionStorage.js';

/** Transport only. Mutations are never retried automatically. */
export const caseApi = {
  async create(input) {
    assertSessionStorageAvailable();
    const { data } = await httpClient.post('/cases', input);
    saveCaseToken(data.case.id, data.caseAccessToken);
    return data.case;
  },
  async get(caseId, signal) {
    const { data } = await httpClient.get(`/cases/${caseId}`, { signal });
    return data.case;
  },
  async getResult(caseId, signal) {
    const { data } = await httpClient.get(`/cases/${caseId}/result`, { signal });
    return data.result;
  },
  async discoverClue(caseId, clueId) {
    const { data } = await httpClient.post(`/cases/${caseId}/clues/${clueId}/discover`, {});
    return data;
  },
  async revealHint(caseId) {
    const { data } = await httpClient.post(`/cases/${caseId}/hints`, {});
    return data;
  },
  async accuse(caseId, suspectId) {
    const { data } = await httpClient.post(`/cases/${caseId}/accuse`, { suspectId });
    return data.result;
  },
};
