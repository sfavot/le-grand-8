<template>

    <div class="page--faq">
        <card-list simple class="welcomeAndLogin">
            <card class="card--welcome">
                <h2 class="card-title">Bienvenue !</h2>
                <p>Envie de pronostiquer des matchs entre amis ?</p>
                <p><strong>
                    Le Grand 8</strong> remplace la bonne vieille feuille Excel partagée par un site accessible sur
                    ordinateur, tablette et téléphone pour le plaisir de tous (Euro, Coupe du monde, championnats…).
                </p>
                <ol>
                    <li>Créez un ou plusieurs groupes</li>
                    <li>Invitez des amis</li>
                    <li>Pronostiquez les matchs</li>
                    <li>Surveillez le classement...</li>
                    <li>... et amusez vous bien ;-)</li>
                </ol>
                <p class="card--provenance">
                    <strong>Ce site n'est pas huitparfait.fr.</strong>
                    J'ai découvert le site Huit Parfait lors de l'Euro 2016 puis de la Coupe du monde 2018 sur
                    <a href="https://huitparfait.fr" rel="noopener noreferrer">huitparfait.fr</a>.
                    Le site d'origine n'étant plus actif, j'ai repris le
                    <a href="https://github.com/huitparfait/huitparfait-2016" rel="noopener noreferrer">code open source</a>
                    du jeu <em>Huit Parfait</em>, modernisé sous le nom <strong>Le Grand 8</strong>, et je l'héberge pour des amis.
                    Tout le mérite du concept et du code initial revient à
                    <a href="https://github.com/huitparfait/huitparfait-2016" rel="noopener noreferrer">l'équipe Huit Parfait (2016)</a>.
                </p>
            </card>
            <card class="card--paused">
                <h2 class="card-title">Site en pause</h2>
                <p>
                    Le Grand&nbsp;8 fait une pause après la Coupe du monde.
                    <strong>Rendez-vous à l'été&nbsp;2028 pour l'Euro&nbsp;!</strong>
                </p>
            </card>
        </card-list>

        <card>
            <h2 class="card-title">Atteindre le Grand 8&nbsp;!</h2>

            <p>Le but du jeu est bien entendu d'avoir le plus gros ... score !</p>
            <p>
                Pour chaque match, vous pouvez gagner jusqu'à 8 points : le fameux <strong>Grand 8</strong> !
                Si vous êtes très mauvais, vous pouvez aussi perdre jusqu'à 3 points, ce qui n'est pas cool.
            </p>
            <p>Vous n'avez que 3 choses à pronostiquer :</p>
            <ol>
                <li>Le nombre de buts de l'équipe A</li>
                <li>Le nombre de buts de l'équipe B</li>
                <li>Est-ce que la "risquette" va se réaliser ?</li>
            </ol>
        </card>

        <card>
            <h2 class="card-title">Comment gagner des points ?</h2>
            <p>
                Pour gagner des points il faut être bon ... ou avoir beaucoup de chance.
                Voici le détails :
            </p>
            <table class="table">
                <tr>
                    <td>Issue du match trouvée (vainqueur ou match nul)</td>
                    <td class="scorePoints">3 pts</td>
                </tr>
                <tr>
                    <td>Nombre de buts de l'équipe A trouvé (hors <abbr title="Tirs Aux Buts">T.A.B.</abbr>)
                    </td>
                    <td class="scorePoints">1 pt</td>
                </tr>
                <tr>
                    <td>Nombre de buts de l'équipe B trouvé (hors <abbr title="Tirs Aux Buts">T.A.B.</abbr>)
                    </td>
                    <td class="scorePoints">1 pt</td>
                </tr>
                <tr>
                    <td>Risquette gagnée</td>
                    <td class="scorePoints">+1 à +3 pts</td>
                </tr>
                <tr>
                    <td>Risquette non jouée (poule mouillée)</td>
                    <td class="scorePoints">0 pt</td>
                </tr>
                <tr>
                    <td>Risquette perdue</td>
                    <td class="scorePoints">−1 à −3 pts</td>
                </tr>
                <tr class="totalPoints">
                    <td>TOTAL</td>
                    <td class="scorePoints">−3 à +8 pts</td>
                </tr>
            </table>
            <p>
                Si vous avez le nombre de buts exact pour les deux équipes et que vous gagnez la risquette maximum,
                vous obtenez un <strong>Grand 8&nbsp;!</strong>
            </p>
        </card>

    <card>
        <h2 class="card-title">Mais au fait, c'est quoi une risquette ?</h2>
        <p>
            Une risquette vous permet de "risquer" des points sur un fait de match prédéfini.
        </p>
        <p>
            Par exemple, pour le match «&nbsp;Mexique&nbsp;-&nbsp;Afrique du Sud&nbsp;», on vous propose une affirmation telle que
            <strong>But du pied gauche</strong>.
            À vous de pronostiquer si cette risquette sera VRAIE ou FAUSSE. Vous pouvez risquer de 1 à 3 points.
            Si à la fin du match vous aviez raison, vous gagnez les points risqués, dans le cas contraire vous perdez
            les points (et votre honneur).
        </p>
        <p>
            Si vous ne vous sentez pas l'âme d'un aventurier vous pouvez choisir de ne rien risquer.
        </p>
    </card>

        <card>
            <h2 class="card-title">Les meilleurs troisièmes (CDM 2026)</h2>
            <p>
                Avec <strong>12 poules de 4 équipes</strong>, seules <strong>32 équipes</strong>
                disputent les 16<sup>e</sup> de finale&nbsp;: les <strong>2 premiers</strong> de chaque poule
                (24 qualifiés) et les <strong>8 meilleurs troisièmes</strong> parmi les 12.
                Les 4 troisièmes les moins bien classés sont éliminés.
            </p>
            <p>
                Pour classer les 3<sup>e</sup> entre eux, la FIFA applique&nbsp;:
                points, différence de buts, buts marqués, fair-play (cartons), puis le classement FIFA
                (<a href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/groups-how-teams-qualify-tie-breakers"
                        rel="noopener noreferrer">règles officielles CDM 2026</a>).
                Le Grand 8 ne prend pour l'instant en compte que les trois premiers critères.
            </p>
            <p>
                L'affectation des 8 repêchés en 16<sup>e</sup> n'est pas libre&nbsp;: la FIFA a prédéfini
                <strong>495 scénarios</strong> (Annexe C du
                <a href="https://www.wk2026voetbal.nl/wk-2026-reglement.pdf"
                        rel="noopener noreferrer">règlement officiel</a>)
                selon quelles poules produisent les 8 meilleurs troisièmes. Chaque 3<sup>e</sup> repêché
                est alors affecté à <strong>un seul match</strong>.
                Sur la page <a v-link="{ name: 'results' }">Résultats</a>, le tableau
                «&nbsp;Meilleurs troisièmes&nbsp;» indique qui est repêché et à quel match il est envoyé.
            </p>
            <p>
                Dans les matchs à élimination directe, un libellé du type
                «&nbsp;3<sup>e</sup> du Groupe A, B, C, D, F&nbsp;» indique les poules <em>éligibles</em>
                pour ce créneau&nbsp;; le scénario FIFA en choisit exactement une parmi les 8 qualifiées.
            </p>
        </card>

        <card>
            <h2 class="card-title">Règles</h2>
            <p>
                Vous devez soumettre votre pronostic au moins une minute avant le match.
                Vous pouvez changer d'avis autant de fois que vous voulez avant.
                C'est le dernier pronostic qui est enregistré.
            </p>
            <p>
                L'éventuelle séance de tirs au but n'est pas comptée pour comparer le score à votre pronostic.
                Par exemple, un match à élimination directe «&nbsp;France&nbsp;-&nbsp;Portugal&nbsp;» se termine avec
                <strong>1&nbsp;-&nbsp;1</strong> à la fin des prolongations et le Portugal gagne la séance de tirs au but
                <strong>3&nbsp;-&nbsp;2</strong>. En phase de groupes de la Coupe du monde 2026, seul le score après 90&nbsp;minutes (et prolongations éventuelles) compte pour votre pronostic, pas les tirs au but.
            </p>
            <ul>
                <li>
                    Si vous pronostiquez <strong>0&nbsp;-&nbsp;0</strong>, <strong>1&nbsp;-&nbsp;1</strong>,
                    <strong>2&nbsp;-&nbsp;2</strong>... vous avez les 3 points pour <em>"issue du match trouvé"</em>.
                </li>
                <li>
                    Si vous pronostiquez
                    <strong>2&nbsp;-&nbsp;1</strong> pour le Portugal, même si celui-ci a gagné le match aux tirs au but,
                    vous n'avez pas les 3 points pour
                    <em>"issue du match trouvé"</em>.
                </li>
            </ul>
        </card>

        <card>
            <h2 class="card-title">À propos de cette version</h2>
            <p>
                Cette instance est maintenue sur mon temps libre pour des pronostics entre amis.
                Il peut y avoir des bugs : les signalements sont les bienvenus sur GitHub.
            </p>
            <p>
                <strong>Le Grand 8</strong> est un jeu de pronostics foot entre amis (reprise du jeu
                <em>Huit Parfait</em>, 2016). Il ne s'agit en aucun cas d'un site de paris ou de jeux d'argent.
            </p>
            <p>
                Code source de cette reprise :
                <a href="https://github.com/sfavot/huitparfait-2026" rel="noopener noreferrer">sfavot/huitparfait-2026</a>
                , projet d'origine :
                <a href="https://github.com/huitparfait/huitparfait-2016" rel="noopener noreferrer">huitparfait/huitparfait-2016</a>
                (licence AGPL-3.0).
            </p>
            <p class="faq-btnBar">
                <link-btn class="faq-btnBar-btn" href="https://github.com/sfavot/huitparfait-2026/issues">Signaler un bug / question</link-btn>
                <link-btn class="faq-btnBar-btn" href="https://github.com/huitparfait/huitparfait-2016">Projet d'origine (2016)</link-btn>
            </p>
        </card>
    </div>

</template>

<script type="text/babel">
    export default {}
</script>

<style scoped>

    .card--welcome {
        flex-basis: 100%;
    }

    .card--provenance {
        border-top: 1px dashed #ccc;
        font-size: 0.95em;
        margin-top: 1.25em;
        padding-top: 1em;
    }

    .card--provenance a {
        color: #3d8f6a;
    }

    .card--paused,
    .card--login {
        flex-basis: 400px;
        overflow: visible;
    }

    @media (min-width: 850px) {
        .welcomeAndLogin {
            flex-wrap: nowrap;
        }
    }

    @media (min-width: 500px) and (max-width: 849px) {
        .card--login-allBtn {
            display: flex;
            justify-content: center;
        }
    }

    .faq-btnBar {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 30px;
    }

    .faq-btnBar-btn {
        box-sizing: border-box;
        display: block;
        text-align: center;
        white-space: normal;
    }

    @media (min-width: 500px) {
        .faq-btnBar {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .faq-btnBar-btn {
            display: inline-block;
            width: auto;
        }
    }

    .loginBtn,
    .contactBtn {
        color: #fff;
        font-weight: bold;
        padding: 8px 15px;
        margin: 20px 0;
        text-align: center;
        text-decoration: none;
        white-space: nowrap;
        border: 1px solid #333;
        border-bottom-width: 2px;
        border-radius: 3px;
    }

    .loginBtn {
        display: inline-block;
    }

    .loginBtn--google {
        background-color: #4285F4;
        border-color: #3971cc;
    }

    .contactBtn {
        background-color: #4db788;
        border-color: #49996f;
    }

    @media (min-width: 500px) and (max-width: 849px) {
        .loginBtn {
            margin: 0 10px;
        }
    }

    .card-title {
        color: #49996f;
        margin-top: 0;
    }

    ol,
    ul {
        padding-left: 25px;
    }

    abbr {
        cursor: help;
    }

    table {
        border-spacing: 0;
        border-collapse: collapse;
        width: 100%;
    }

    td {
        border-top: 1px solid #eee;
        padding: 5px 10px;
    }

    tr:nth-child(2n+1) td {
        background-color: #f9f9f9;
    }

    tr.totalPoints td {
        border-bottom: 1px dashed #aaa;
        border-top: 1px dashed #aaa;
        color: #333;
        font-weight: bold;
    }

    .scorePoints {
        color: #49996f;
        font-weight: bold;
        white-space: nowrap;
    }

</style>
