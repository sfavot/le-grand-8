<script type="text/babel">

    import store from '../state/configureStore'
    import { joinGroup } from '../state/actions/groups'

    export default {
        route: {
            canActivate({ to: { params: { groupId } }, redirect }) {
                return store.dispatch(joinGroup({ id: groupId })).then(() => {
                    redirect({ name: 'groupRanking', params: { groupId: groupId } })
                })
            },
        },
    }

</script>
