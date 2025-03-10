import { createViewPage, isValidURL, getVH, CrossTabCommunication, PolarisError, storage } from './utils.js';
import { loadSettings, loadSidebarInterface } from './settings.js';
import loadEasterEggs from './eastereggs.js';
import loadAnalytics from './analytics.js';
import Search from './search.js';
import Cheats from './cheats.js';
import Games from './games.js';
import Apps from './apps.js';

const umami = await loadAnalytics();

if (location.pathname !== '/view') loadSidebarInterface();
loadEasterEggs();

/*const ctcClient = new CrossTabCommunication();

ctcClient.on('open', (connection) => {
    connection.on('message', (message) => {
        console.log(message);
    });
});

/*setInterval(() => {
    ctcClient.brodcast('hello from ' + location.href);
}, 1000);*/

const settingsStorage = storage('settings');
var preventClose = false;

window.addEventListener('beforeunload', (e) => sessionStorage.setItem('was_closing', 'true'));

window.addEventListener('beforeunload', (e) => {
    document.body.style.opacity = '0.7';

    if (settingsStorage.get('prevent_close')) {
        e.preventDefault();

        return e;
    }
});

setInterval(() => {
    if (sessionStorage.getItem('was_closing') === 'true') document.body.style.opacity = '1';
    preventClose = settingsStorage.get('prevent_close');
}, 1);

/*await navigator.serviceWorker.register('/assets/js/offline.js', {
    scope: '/'
});*/

localStorage.clear();

window.addEventListener('DOMContentLoaded', () => setTimeout(() => document.body.style.opacity = 1, 1000));

/**
 * @param {HTMLAnchorElement} hyperlink
 */
const hyperlinkHandler = (hyperlink, e) => {
    if (hyperlink.dataset.action === 'no_redirect') e.preventDefault();
    else if (hyperlink.href && hyperlink.target !== '_blank') {
        e.preventDefault();

        document.body.style.opacity = '0.7';

        if (new URL(hyperlink.href).pathname === location.pathname) setTimeout(() => document.body.style.opacity = '', 1000);
        else {
            /*setTimeout(async () => {
                const style = document.createElement('style');
                style.textContent = `
                * {
                    transition: none;
                }`;

                document.body.querySelectorAll('*').forEach(el => {
                    el.style.transition = 'none';
                    el.style.display = 'none';
                });

                if (new URL(hyperlink.href).host === location.host) {
                    const page = new DOMParser().parseFromString(await (await fetch(hyperlink.href)).text(), 'text/html');
                    document.head.innerHTML = page.head.innerHTML;
                    document.head.appendChild(style);

                    window.history.pushState({}, '', hyperlink.href);

                    const scripts = page.body.querySelectorAll('script');

                    page.body.querySelectorAll('script').forEach(script => script.remove());

                    document.body.innerHTML = page.body.innerHTML;

                    document.body.style.display = 'none';

                    document.querySelectorAll('a').forEach(hyperlink => hyperlink.addEventListener('click', (e) => hyperlinkHandler(hyperlink, e)));

                    setTimeout(() => document.body.style.display = '', 100);

                    setTimeout(() => {
                        style.remove();
                    }, 500);
                } else setTimeout(() => window.location.href = hyperlink.href, 500);
            }, 500);//*/

            setTimeout(() => window.location.href = hyperlink.href, 500);
        }
    }
};

document.querySelectorAll('a').forEach(hyperlink => hyperlink.addEventListener('click', (e) => hyperlinkHandler(hyperlink, e)));

window.onhashchange = () => {
    if (location.hash === '#settings') {
        document.querySelector('.sidebar').classList.add('active');
        umami.track('sidebar-open');
    } else {
        document.querySelector('.sidebar').classList.remove('active');
        umami.track('sidebar-close');
    }
};

if (window.self === window.top && location.pathname !== '/view') setTimeout(async () => {
    loadSettings();

    if (location.pathname === '/games') Games.load();
    if (location.pathname === '/apps') Apps.load();
    if (location.pathname === '/search') Search.load();
    if (location.pathname === '/cheats') Cheats.load();
}, 500);

if (location.pathname !== '/view') fetch('/api/changelog')
    .then(res => res.json())
    .then(changelog => {
        document.querySelector('#version').textContent = changelog.version !== 'unknown' ? 'v' + changelog.version : changelog.version;
        document.querySelector('#version_sha').textContent = changelog.commit.sha.slice(0, 7);
        document.querySelector('#up_to_date').textContent = changelog.upToDate ? 'yes' : 'no';
        document.querySelector('#mode').textContent = changelog.mode;
    });

if (location.pathname === '/') {
    fetch('/api/games')
        .then(res => res.json())
        .then(games => {
            const gameName = 'Retro Bowl';
            const game = games.all.filter(g => g.name === gameName)[0];

            document.querySelector('.featured').addEventListener('click', () => {
                document.body.style.opacity = '0.7';

                umami.track('featured-game', { name: game.name });

                setTimeout(() => {
                    if (isValidURL(game.target)) createViewPage({
                        target: game.target,
                        title: game.name,
                        proxied: true
                    });
                    else createViewPage({
                        target: game.target,
                        title: game.name
                    });
                }, 1000);
            });

            document.querySelector('.featured').src = '/assets/img/wide/retrobowl.png';
        }).catch(e => new PolarisError('Failed to load featured game.'));

    const logHeight = () => {
        const log = document.createElement('div');
        document.querySelector('#changelog').appendChild(log);

        const date = document.createElement('p');
        date.textContent = 'a';
        date.classList = 'small';
        log.appendChild(date);

        const description = document.createElement('i');
        description.textContent = 'a';
        description.classList = 'small';
        log.appendChild(description);

        const height = log.clientHeight;

        log.remove();

        return height;
    };

    const getAvalibleHeight = () => {
        var total = 0;

        document.querySelectorAll('.container.right>*:not(#changelog)').forEach(el => total += Number((el.currentStyle || window.getComputedStyle(el)).marginTop.replace('px', '')) + Number((el.currentStyle || window.getComputedStyle(el)).marginTop.replace('px', '')) + el.clientHeight);

        return (document.querySelector('.container.right').clientHeight - getVH(2)) - total;
    }

    fetch('/api/changelog')
        .then(res => res.json())
        .then(changelog => {
            changelog.changelog
                .filter((data, i) => !(i >= 3))
                .forEach(change => {
                    const log = document.createElement('div');
                    document.querySelector('#changelog').appendChild(log);

                    const date = document.createElement('p');
                    date.textContent = change.date;
                    date.classList = 'small';
                    log.appendChild(date);

                    const description = document.createElement('i');
                    description.textContent = change.simpleDescription;
                    description.classList = 'small';
                    log.appendChild(description);

                });

            const updateChangelog = (amount = 3) => {
                amount = amount - 1;

                for (let i = 0; i < document.querySelector('#changelog').children.length; i++) {
                    if (i > amount) document.querySelector('#changelog').children[i].classList.add('hidden');
                    else document.querySelector('#changelog').children[i].classList.remove('hidden');
                }
            }

            updateChangelog(Math.floor(getAvalibleHeight() / logHeight()));
            window.addEventListener('resize', () => updateChangelog(Math.floor(getAvalibleHeight() / logHeight())));
        });
}

if (window.self === window.top && location.pathname !== '/view') {
    if (window.scrollY !== 0) document.querySelector('.navbar').classList.add('scrolling');
    else document.querySelector('.navbar').classList.remove('scrolling');
}

if (window.self === window.top && location.pathname !== '/view') window.onscroll = () => {
    if (window.scrollY !== 0) document.querySelector('.navbar').classList.add('scrolling');
    else document.querySelector('.navbar').classList.remove('scrolling');
}

if (window.self !== window.top && document.querySelector('.navbar')) document.querySelector('.navbar').remove();