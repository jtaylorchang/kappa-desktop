import moment from 'moment';

import { TCandidateDict, TCandidate } from '@backend/voting';
import { sortUserByName } from './kappaService';

export const CLASS_YEAR_OPTIONS = [
  { id: 'FR', title: 'Freshman' },
  { id: 'SO', title: 'Sophomore' },
  { id: 'JR', title: 'Junior' },
  { id: 'SR', title: 'Senior' }
];

export const separateByCandidateEmail = (candidates: TCandidate[]) => {
  const separated = {};

  for (const candidate of candidates) {
    separated[candidate.email] = candidate;
  }

  return separated;
};

export const mergeCandidates = (emailToCandidate: TCandidateDict, newCandidates: TCandidate[]) => {
  const merged = emailToCandidate;

  for (const candidate of newCandidates) {
    merged[candidate.email] = candidate;
  }

  return merged;
};

export const sortSessionByDate = (a: { startDate: string }, b: { startDate: string }) =>
  moment(a.startDate).isBefore(moment(b.startDate)) ? -1 : 1;

export const recomputeVotingState = ({ emailToCandidate }: { emailToCandidate: TCandidateDict }) => {
  const candidateArray = Object.values(emailToCandidate).sort(sortUserByName);
  const approvedCandidateArray = candidateArray.filter((candidate) => candidate.approved);
  const unapprovedCandidateArray = candidateArray.filter((candidate) => !candidate.approved);

  return {
    emailToCandidate,
    candidateArray,
    approvedCandidateArray,
    unapprovedCandidateArray
  };
};