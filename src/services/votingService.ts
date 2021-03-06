import moment from 'moment';

import { TCandidateDict, TCandidate, TSession, TSessionToCandidateToVoteDict, TVote } from '@backend/voting';
import { TDirectory } from '@backend/kappa';
import { sortUserByName } from '@services/kappaService';

/**
 * Options for session types.
 */
export const TYPE_OPTIONS = [
  { id: 'REGULAR', title: 'One at a time' },
  { id: 'MULTI', title: 'Multiple choice' }
];

/**
 * Options for candidate class years.
 */
export const CLASS_YEAR_OPTIONS = [
  { id: 'FR', title: 'Freshman' },
  { id: 'SO', title: 'Sophomore' },
  { id: 'JR', title: 'Junior' },
  { id: 'SR', title: 'Senior' }
];

/**
 * Create a map from candidate email to candidate.
 */
export const separateByCandidateEmail = (candidates: TCandidate[]): TCandidateDict => {
  const separated = {};

  for (const candidate of candidates) {
    separated[candidate.email] = candidate;
  }

  return separated;
};

/**
 * Create a map from candidate id to candidate.
 */
export const separateByCandidateId = (candidates: TCandidate[]): TCandidateDict => {
  const separated = {};

  for (const candidate of candidates) {
    separated[candidate._id] = candidate;
  }

  return separated;
};

/**
 * Merge a list of candidates into an existing candidate email map.
 */
export const mergeCandidates = (emailToCandidate: TCandidateDict, newCandidates: TCandidate[]): TCandidateDict => {
  const merged = emailToCandidate;

  for (const candidate of newCandidates) {
    merged[candidate.email] = candidate;
  }

  return merged;
};

/**
 * Create a map from session id to session.
 */
export const separateBySessionId = (
  sessions: TSession[]
): {
  [_id: string]: TSession;
} => {
  const separated = {};

  for (const session of sessions) {
    separated[session._id] = session;
  }

  return separated;
};

/**
 * Merge a list of sessions with another list of newer session data.
 */
export const mergeSessions = (sessions: TSession[], newSessions: TSession[]): TSession[] => {
  const idToSession = separateBySessionId(sessions);

  for (const session of newSessions) {
    idToSession[session._id] = session;
  }

  return Object.values(idToSession).sort(sortSessionByDate);
};

/**
 * Sorting function to sort sessions by their date.
 */
export const sortSessionByDate = (a: { startDate: string }, b: { startDate: string }) =>
  moment(a.startDate).isBefore(moment(b.startDate)) ? -1 : 1;

/**
 * Merge a given session-candidate-vote map with an array of new votes.
 */
export const mergeVotes = (
  sessionToCandidateToVotes: TSessionToCandidateToVoteDict,
  newVotes: TVote[],
  overwrite: boolean = false
) => {
  const mergedVotes = overwrite ? {} : sessionToCandidateToVotes;

  if (newVotes.length === 0) {
    return mergedVotes;
  }

  const duplicateVoteCheck: {
    [sessionId: string]: {
      [candidateId: string]: {
        [email: string]: TVote;
      };
    };
  } = {};

  // load current votes into duplicate check
  for (const sessionId of Object.keys(mergedVotes)) {
    for (const candidateId of Object.keys(mergedVotes[sessionId])) {
      for (const vote of mergedVotes[sessionId][candidateId]) {
        if (!duplicateVoteCheck.hasOwnProperty(sessionId)) {
          duplicateVoteCheck[sessionId] = {};
        }

        if (!duplicateVoteCheck[sessionId].hasOwnProperty(candidateId)) {
          duplicateVoteCheck[sessionId][candidateId] = {};
        }

        duplicateVoteCheck[sessionId][candidateId][vote.userEmail] = vote;
      }
    }
  }

  // incorporate new votes
  for (const vote of newVotes) {
    const sessionId = vote.sessionId;
    const candidateId = vote.candidateId;
    const email = vote.userEmail;

    if (!duplicateVoteCheck.hasOwnProperty(sessionId)) {
      duplicateVoteCheck[sessionId] = {};
    }

    if (!duplicateVoteCheck[sessionId].hasOwnProperty(candidateId)) {
      duplicateVoteCheck[sessionId][candidateId] = {};
    }

    duplicateVoteCheck[sessionId][candidateId][email] = vote;
  }

  // update merged
  for (const sessionId of Object.keys(duplicateVoteCheck)) {
    for (const candidateId of Object.keys(duplicateVoteCheck[sessionId])) {
      if (!mergedVotes.hasOwnProperty(sessionId)) {
        mergedVotes[sessionId] = {};
      }

      if (!mergedVotes[sessionId].hasOwnProperty(candidateId)) {
        mergedVotes[sessionId][candidateId] = [];
      }

      mergedVotes[sessionId][candidateId] = Object.values(duplicateVoteCheck[sessionId][candidateId]);
    }
  }

  return mergedVotes;
};

/**
 * Get the pretty votes for a given session and candidate.
 */
export const getVotes = (
  sessionToCandidateToVotes: TSessionToCandidateToVoteDict,
  sessionId: string,
  candidateId: string,
  directory: TDirectory
): (TVote & { userName: string })[] => {
  if (
    !sessionToCandidateToVotes.hasOwnProperty(sessionId) ||
    !sessionToCandidateToVotes[sessionId].hasOwnProperty(candidateId)
  ) {
    return [];
  }

  return sessionToCandidateToVotes[sessionId][candidateId].map((vote) => {
    const user = directory[vote.userEmail];
    return {
      ...vote,
      userName: user ? `${user.familyName}, ${user.givenName}` : vote.userEmail
    };
  });
};

/**
 * Get the votes for a given session.
 */
export const getVotesBySession = (
  sessionToCandidateToVotes: TSessionToCandidateToVoteDict,
  sessionId: string
): {
  [candidateId: string]: TVote[];
} => {
  if (!sessionToCandidateToVotes.hasOwnProperty(sessionId)) {
    return {};
  }

  return sessionToCandidateToVotes[sessionId];
};

/**
 * Compute the next voting state based on the candidate map.
 */
export const recomputeVotingState = ({ emailToCandidate }: { emailToCandidate: TCandidateDict }) => {
  const candidateArray = Object.values(emailToCandidate).sort(sortUserByName);
  const idToCandidate = separateByCandidateId(candidateArray);
  const approvedCandidateArray = candidateArray.filter((candidate) => candidate.approved);
  const unapprovedCandidateArray = candidateArray.filter((candidate) => !candidate.approved);

  return {
    emailToCandidate,
    idToCandidate,
    candidateArray,
    approvedCandidateArray,
    unapprovedCandidateArray
  };
};
