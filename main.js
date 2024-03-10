const { resolve, basename } = require('path');
const {
  app, Menu, Tray, dialog,
} = require('electron');

const { spawn } = require('child_process');
const fs = require('fs');

const Store = require('electron-store');


const schema = {
  projects: {
    type: 'string',
  },
};

let mainTray = {};

if (app.dock) {
  app.dock.hide();
}

const store = new Store({ schema });

function getLocale() {
  const locale = app.getLocale();

  switch (locale) {
    case 'es-419' || 'es':
      return JSON.parse(fs.readFileSync(resolve(__dirname, 'locale/es.json')));
    case 'pt-BR' || 'pt-PT':
      return JSON.parse(fs.readFileSync(resolve(__dirname, 'locale/pt.json')));
    default:
      return JSON.parse(fs.readFileSync(resolve(__dirname, 'locale/en.json')));
  }
}

function render(tray = mainTray) {
  const storedProjects = store.get('projects');
  const projects = storedProjects ? JSON.parse(storedProjects) : [];
  const locale = getLocale();

  const items = projects.map(({ name, path }) => ({
    label: name,
    submenu: [
      {
        label: locale.open,
        click: () => {
          spawn('code', [path], { shell: true });
        },
      },
      {
        label: locale.remove,
        click: () => {
          store.set('projects', JSON.stringify(projects.filter(item => item.path !== path)));
          render();
        },
      },
    ],
  }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: locale.add,
      click: () => {
        const result = dialog.showOpenDialog({ properties: ['openDirectory'] });

        if (!result) return;

        result
            .then((path2) => {
                const name = basename(path2.filePaths[0]);
                const path = path2.filePaths[0];

                store.set('projects', JSON.stringify([
                    ...projects, {
                        name,
                        path,
                    }
                ]));

                render();
            })
            .catch(onRejected => {
                console.log("Rejeitado => ",onRejected);
            });

        render();
      },
    },
    {
      type: 'separator',
    },
    ...items,
    {
      type: 'separator',
    },
    {
      type: 'normal',
      label: locale.close,
      role: 'quit',
      enabled: true,
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', tray.popUpContextMenu);
}

app.on('ready', () => {
  mainTray = new Tray(resolve(__dirname, 'assets', 'iconTemplate.png'));

  render(mainTray);
});