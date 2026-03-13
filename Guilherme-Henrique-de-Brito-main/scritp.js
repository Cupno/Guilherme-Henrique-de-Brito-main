(function () {
    // Configurações simples
    const containerSelector = 'body'; // onde procurar listas (mude se quiser)
    const listSelector = `${containerSelector} ul, ${containerSelector} ol`;

    document.addEventListener('DOMContentLoaded', () => {
        const lists = Array.from(document.querySelectorAll(listSelector));
        if (!lists.length) return;

        // Estilos mínimos (embutidos para evitar alterar CSS externo)
        const style = document.createElement('style');
        style.textContent = `
            /* área fixa no topo com "compartimentos" */
            .top-compartments {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(180deg,#07122b 0%, #0b2540 100%);
                color: #cfe8f6;
                z-index: 9999;
                padding: 12px 48px 12px 12px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.45);
                transition: height 180ms ease, padding 180ms ease;
            }
            .top-compartments .toggle-btn {
                position: absolute;
                right: 12px;
                top: 12px;
                background: transparent;
                border: 1px solid rgba(255,255,255,0.08);
                color: #dff8ff;
                padding: 6px 10px;
                border-radius: 6px;
                cursor: pointer;
            }
            .tabs-bar { display:flex; gap:6px; margin:0; flex-wrap:wrap; align-items:center; }
            .tabs-bar button { padding:6px 10px; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.03); color: #cfe8f6; cursor:pointer; border-radius:4px; }
            .tabs-bar button[aria-selected="true"] { background: rgba(255,255,255,0.06); border-bottom:2px solid #7ee7ff; font-weight:600; color: #ffffff; }
            .panels-wrapper { display:flex; gap:12px; margin-top:12px; overflow-x:auto; padding-bottom:6px; }
            .list-panel { display:none; min-width:280px; max-width:calc(100% - 40px); max-height:320px; overflow:auto; padding:12px; border:1px solid rgba(255,255,255,0.04); background: rgba(255,255,255,0.02); border-radius:6px; box-shadow: 0 1px 6px rgba(0,0,0,0.25); color: #d5eefb; }
            .list-panel.active { display:block; }
            /* estado colapsado: esconde abas/painéis, mantém o botão visível */
            .top-compartments.collapsed { padding-bottom: 12px; height: 48px; overflow: visible; }
            .top-compartments.collapsed .tabs-bar,
            .top-compartments.collapsed .panels-wrapper { display: none; }
        `;
        document.head.appendChild(style);

        // Criar área fixa no topo que conterá abas e painéis
        const fixedArea = document.createElement('div');
        fixedArea.className = 'top-compartments';
        fixedArea.setAttribute('role', 'region');
        fixedArea.setAttribute('aria-label', 'Compartimentos de listas');

        // Criar wrapper das abas
        const tabBar = document.createElement('div');
        tabBar.className = 'tabs-bar';
        tabBar.setAttribute('role', 'tablist');

        // Wrapper para os painéis (retângulos)
        const panelsWrapper = document.createElement('div');
        panelsWrapper.className = 'panels-wrapper';

        // Botão de mostrar/ocultar as abas
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'toggle-btn';
        toggleBtn.setAttribute('aria-expanded', 'true');
        toggleBtn.textContent = 'Ocultar compartimentos';

        fixedArea.appendChild(tabBar);
        fixedArea.appendChild(panelsWrapper);
        fixedArea.appendChild(toggleBtn);

        // Envolver cada lista em um painel e criar botão correspondente
        const panels = lists.map((list, i) => {
            const title = list.getAttribute('data-title') ||
                list.getAttribute('aria-label') ||
                (list.querySelector('li') ? list.querySelector('li').textContent.slice(0, 20).trim() : `Lista ${i + 1}`);

            // Criar botão da aba
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = `tab-${i}`;
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', 'false');
            btn.setAttribute('aria-controls', `panel-${i}`);
            btn.textContent = title;
            tabBar.appendChild(btn);

            // Criar painel que envolverá a lista (retângulo)
            const panel = document.createElement('div');
            panel.id = `panel-${i}`;
            panel.className = 'list-panel';
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-labelledby', btn.id);

            // Mover a lista para dentro do painel (remove do local original)
            panel.appendChild(list);

            // Colocar o painel dentro do wrapper fixo no topo
            panelsWrapper.appendChild(panel);

            return { btn, panel };
        });

        // Inserir a área fixa no topo da página
        document.body.insertBefore(fixedArea, document.body.firstChild);

        // Ajustar padding-top do body para que o conteúdo não fique escondido atrás da área fixa
        function adjustBodyPadding() {
            requestAnimationFrame(() => {
                // se estiver colapsado, reserva só a altura mínima (48px)
                const h = fixedArea.classList.contains('collapsed')
                    ? 56
                    : fixedArea.getBoundingClientRect().height;
                document.body.style.paddingTop = `${Math.ceil(h + 8)}px`;
            });
        }
        adjustBodyPadding();
        // reajustar ao redimensionar
        window.addEventListener('resize', adjustBodyPadding);

        // Função para ativar uma aba
        function activate(index) {
            panels.forEach(({ btn, panel }, i) => {
                const active = i === index;
                btn.setAttribute('aria-selected', active ? 'true' : 'false');
                btn.tabIndex = active ? 0 : -1;
                panel.classList.toggle('active', active);
            });
            panels[index].btn.focus();
            // garantir que o painel ativo fique visível horizontalmente
            panels[index].panel.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }

        // Eventos de clique e teclado
        panels.forEach(({ btn }, i) => {
            btn.addEventListener('click', () => activate(i));
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const dir = e.key === 'ArrowRight' ? 1 : -1;
                    const next = (i + dir + panels.length) % panels.length;
                    activate(next);
                }
            });
        });

        // Toggle mostrar/ocultar compartimentos
        function setCollapsed(collapsed) {
            fixedArea.classList.toggle('collapsed', collapsed);
            toggleBtn.setAttribute('aria-expanded', String(!collapsed));
            toggleBtn.textContent = collapsed ? 'Mostrar compartimentos' : 'Ocultar compartimentos';
            adjustBodyPadding();
        }
        toggleBtn.addEventListener('click', () => setCollapsed(!fixedArea.classList.contains('collapsed')));

        // Ativa a primeira aba por padrão
        activate(0);
    });
})();