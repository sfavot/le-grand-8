<template>
    <div class="main" :class="{ 'isDisconnected': user == null }">
        <title-bar class="titlebar" :class="{ 'isDisconnected': user == null }"></title-bar>
        <div class="view-container">
            <router-view class="view" :class="{ 'view--hidden': submenu != false }"></router-view>
            <div v-if="submenu != false"
                    class="view-backdrop"
                    @click="closeSubmenu">
            </div>
        </div>
        <menu-bar class="menubar" :class="{ 'isDisconnected': user == null }"></menu-bar>
    </div>
</template>

<script type="text/babel">
    import TitleBar from 'components/TitleBar'
    import MenuBar from 'components/MenuBar'
    import store from './state/configureStore'
    import { hideSubmenu } from './state/actions/submenu'

    export default {
        replace: false,
        components: {
            TitleBar,
            MenuBar,
        },
        data() {
            return {
                user: this.$select('user'),
                submenu: this.$select('submenu'),
            }
        },
        methods: {
            closeSubmenu() {
                if (this.submenu !== false) {
                    store.dispatch(hideSubmenu())
                }
            },
        },
    }
</script>

<style scoped>

    .main {
        box-sizing: border-box;
        margin: 0 auto;
        padding: 48px 0 72px 0;
        max-width: 1680px;
        width: 100%;
    }

    .main.isDisconnected {
        padding-bottom: 0;
    }

    @media (min-width: 500px) {
        .main {
            padding: 68px 7px 72px 7px;
        }
    }

    @media (min-width: 850px) {
        .main {
            padding: 90px 5px 0 255px;
        }

        .main.isDisconnected {
            padding: 90px 7px 0 7px;
        }
    }

    .titlebar {
        background-color: #4db788;
        border-bottom: 2px solid #49996f;
        box-sizing: border-box;
        height: 44px;
        line-height: 44px;
        font-size: 20px;
        left: 0;
        position: fixed;
        text-align: center;
        top: 0;
        right: 0;
        z-index: 3;
    }

    @media (min-width: 850px) {
        .titlebar {
            height: 56px;
            line-height: 56px;
        }

        .titlebar.isDisconnected {
            left: 0;
        }
    }

    .view-container {
        position: relative;
    }

    .view {
        position: relative;
    }

    .view-backdrop {
        background-color: rgba(255, 255, 255, 0.8);
        height: 100%;
        left: 0;
        position: absolute;
        top: 0;
        width: 100%;
        z-index: 1;
    }

    @media (min-width: 850px) {
        .view-backdrop {
            display: none;
        }
    }

    @supports (pointer-events: none) {

        .view:after {
            background-color: #fff;
            content: '';
            display: block;
            height: 100%;
            left: 0;
            position: absolute;
            opacity: 0;
            top: 0;
            transition: 150ms opacity ease-in-out;
            width: 100%;
            pointer-events: none;
        }

        .view.view--hidden:after {
            opacity: 0.8;
        }
    }

    @media (min-width: 850px) {
        .view:after {
            display: none;
        }
    }

    .menubar {
        border-top-style: solid;
        border-top-width: 2px;
        bottom: -1px;
        height: 41px;
        left: 0;
        position: fixed;
        width: 100%;
        z-index: 2;
    }

    .menubar.isDisconnected {
        display: none;
    }

    @media (min-height: 550px) {
        .menubar {
            height: 71px;
        }
    }

    @media (min-width: 850px) {
        .menubar {
            border-top-style: none;
            border-top-width: 0;
            bottom: auto;
            height: calc(100vh - 90px);
            max-height: calc(100vh - 90px);
            overflow-x: hidden;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            top: 90px;
            width: 250px;
        }
    }

</style>
