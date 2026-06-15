<template>
    <div>
        <div v-if="showBreakdown" class="game-pointsExplanation">
            {{ points }} pts : {{ classicPoints }} pts {{ riskSign }}
            {{ riskPointsAbs }} pts (risquette)
        </div>
        <div v-if="showGrand8" class="game-pointsExplanation">
            Grand 8 !
        </div>
        <div v-if="showNoPrediction" class="game-pointsExplanation game-pointsExplanation--none">
            Pas de pronostic
        </div>
    </div>
</template>

<script type="text/babel">
    export default {
        props: {
            points: null,
            classicPoints: null,
            riskPoints: null,
            finished: {
                type: Boolean,
                required: true,
            },
            hasPrediction: {
                type: Boolean,
                default: true,
            },
            readOnly: {
                type: Boolean,
                default: false,
            },
        },
        computed: {
            showBreakdown() {
                return this.finished && this.points != null && this.points < 8
            },
            showGrand8() {
                return this.finished && this.points === 8
            },
            showNoPrediction() {
                return this.readOnly && this.finished && !this.hasPrediction && this.points == null
            },
            riskSign() {
                return (this.riskPoints || 0) >= 0 ? '+' : '-'
            },
            riskPointsAbs() {
                return Math.abs(this.riskPoints || 0)
            },
        },
    }
</script>

<style scoped>
    .game-pointsExplanation {
        color: #49996f;
        font-weight: bold;
        margin-top: 8px;
        text-align: center;
    }

    .game-pointsExplanation--none {
        color: #999;
        font-weight: normal;
    }
</style>
