<template>
    <div class="titleBar" :class="{ 'isLoading': loaders > 0 }">
        <div class="title">
            <span class="titleLeGrand">Le Grand</span>
            <img class="titleLogo" src="/static/logo_small.webp" alt="">
        </div>
    </div>
</template>

<script>

    export default {
        data() {
            return {
                loaders: this.$select('loaders'),
            }
        },
    }

</script>

<style scoped>

    .titleBar {
        align-items: center;
        background-color: #4db788;
        border-bottom: 2px solid #49996f;
        box-sizing: border-box;
        color: #fff;
        display: flex;
        font-weight: bold;
        justify-content: center;
        min-height: 0;
        overflow: hidden;
    }

    @keyframes move {
        0% {
            background-position: 0 0;
        }
        100% {
            background-position: 50px 50px;
        }
    }

    .isLoading {
        animation: move 2s linear infinite;
        background-image: linear-gradient(
                -45deg,
                rgba(255, 255, 255, .1) 25%,
                transparent 25%,
                transparent 50%,
                rgba(255, 255, 255, .1) 50%,
                rgba(255, 255, 255, .1) 75%,
                transparent 75%,
                transparent
        );
        background-size: 50px 50px;
    }

    .title {
        align-items: center;
        display: flex;
        gap: 0.35em;
        line-height: 1;
    }

    .titleLogo {
        display: block;
        height: 32px;
        width: auto;
    }

    @media (min-width: 850px) {
        .titleLogo {
            height: 40px;
        }
    }

</style>
