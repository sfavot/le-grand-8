import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizePenalties } from '../src/services/adminService.js'

describe('normalizePenalties', () => {
    it('ignore les tirs au but en phase de groupes', () => {
        assert.deepEqual(normalizePenalties({
            phase: 'Groupes',
            goalsTeamA: 1,
            goalsTeamB: 1,
            penaltiesTeamA: 4,
            penaltiesTeamB: 5,
        }), {
            penaltiesTeamA: null,
            penaltiesTeamB: null,
        })
    })

    it('accepte les tirs au but sur match nul en phase finale', () => {
        assert.deepEqual(normalizePenalties({
            phase: 'Quart de finale',
            goalsTeamA: 1,
            goalsTeamB: 1,
            penaltiesTeamA: 4,
            penaltiesTeamB: 5,
        }), {
            penaltiesTeamA: 4,
            penaltiesTeamB: 5,
        })
    })

    it('efface les tirs au but si le match n\'est pas nul', () => {
        assert.deepEqual(normalizePenalties({
            phase: 'Finale',
            goalsTeamA: 2,
            goalsTeamB: 1,
            penaltiesTeamA: 4,
            penaltiesTeamB: 5,
        }), {
            penaltiesTeamA: null,
            penaltiesTeamB: null,
        })
    })

    it('refuse un seul score de tirs au but renseigné', () => {
        assert.throws(() => normalizePenalties({
            phase: 'Finale',
            goalsTeamA: 1,
            goalsTeamB: 1,
            penaltiesTeamA: 4,
            penaltiesTeamB: null,
        }), /deux scores aux tirs au but/)
    })

    it('refuse une égalité aux tirs au but', () => {
        assert.throws(() => normalizePenalties({
            phase: 'Finale',
            goalsTeamA: 1,
            goalsTeamB: 1,
            penaltiesTeamA: 4,
            penaltiesTeamB: 4,
        }), /égalité/)
    })
})
