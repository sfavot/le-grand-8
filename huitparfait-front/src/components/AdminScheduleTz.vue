<template>
    <div>
        <div class="admin-timezone-info" v-if="tz.knownCity">
            <p>Fuseau du lieu : <strong>{{ tz.venueLabel }}</strong> ({{ tz.timeZone }})</p>
            <p v-if="tz.parisPreview">Équivalent Paris : {{ tz.parisPreview }}</p>
            <p v-if="!tz.valid" class="admin-timezone-hint">
                Saisis une date et une heure valides pour prévisualiser l’équivalent Paris.
            </p>
        </div>
        <p class="admin-message admin-message--error" v-if="!tz.knownCity && city">
            Ville inconnue — choisis une ville de la liste pour gérer le fuseau horaire.
        </p>
    </div>
</template>

<script type="text/babel">
    import { buildSchedulePreview } from '../gameTimeUtils'

    export default {
        props: ['city', 'date', 'time'],
        computed: {
            tz() {
                return buildSchedulePreview(this.date, this.time, this.city)
            },
        },
    }
</script>

<style scoped>
    .admin-timezone-info {
        background: #f4f8f6;
        border-radius: 6px;
        color: #444;
        font-size: 0.9em;
        margin-bottom: 12px;
        padding: 10px 12px;
    }

    .admin-timezone-info p {
        margin: 0 0 6px;
    }

    .admin-timezone-info p:last-child {
        margin-bottom: 0;
    }

    .admin-timezone-hint {
        color: #666;
        font-size: 0.85em;
        font-style: italic;
    }

    .admin-message--error {
        color: #b00020;
        margin: 0 0 12px;
    }
</style>
