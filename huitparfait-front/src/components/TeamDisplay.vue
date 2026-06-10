<template>
    <span class="teamDisplay" :class="teamDisplayClass">
        <template v-if="isHome">
            <span>{{* displayLabel }}</span>
            <img v-if="team.type === 'team' && team.countryCode"
                    class="flag"
                    :src="flagSrc(team.countryCode)"
                    @error="onFlagError"/>
        </template>
        <template v-else>
            <img v-if="team.type === 'team' && team.countryCode"
                    class="flag"
                    :src="flagSrc(team.countryCode)"
                    @error="onFlagError"/>
            <span>{{* displayLabel }}</span>
        </template>
    </span>
</template>

<script type="text/babel">
    import { flagSrc, onFlagError } from '../flagSrc'

    export default {
        props: {
            team: {
                type: Object,
                required: true,
            },
            side: {
                type: String,
                default: 'away',
            },
        },
        computed: {
            isHome() {
                return this.side === 'home'
            },
            displayLabel() {
                if (this.team.type === 'team') {
                    return this.team.countryName
                }

                if (this.team.type === 'slot') {
                    return this.team.label
                }

                return this.team.label || 'À déterminer'
            },
            teamDisplayClass() {
                return {
                    'teamDisplay--home': this.isHome,
                    'teamDisplay--away': !this.isHome,
                    'teamDisplay--slot': this.team.type === 'slot',
                    'teamDisplay--unknown': this.team.type === 'unknown',
                }
            },
        },
        methods: {
            flagSrc,
            onFlagError,
        },
    }
</script>

<style scoped>

    .teamDisplay {
        align-items: center;
        display: inline-flex;
        gap: 6px;
    }

    .teamDisplay--slot,
    .teamDisplay--unknown {
        color: #777;
        font-style: italic;
    }

    .flag {
        flex-shrink: 0;
        height: 18px;
        width: 28px;
    }

</style>
