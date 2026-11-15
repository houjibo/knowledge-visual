(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HighNetworkAssemblyModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const RATE_OPTIONS = Object.freeze([2, 4, 6, 8, 12, 20]);
  const LINKS = Object.freeze({
    wan: Object.freeze({label: '服务器接入（WAN）', from: 'server', to: 'router'}),
    core: Object.freeze({label: '路由器—交换机主干', from: 'router', to: 'switch'}),
    desktop: Object.freeze({label: '交换机—台式机有线链路', from: 'switch', to: 'desktop'}),
    ap: Object.freeze({label: '交换机—无线接入点上联', from: 'switch', to: 'ap'}),
    wifi: Object.freeze({label: '笔记本 Wi-Fi 接入', from: 'ap', to: 'laptop'}),
    wired: Object.freeze({label: '交换机—笔记本有线链路', from: 'switch', to: 'laptop'})
  });
  const LINK_IDS = Object.freeze(Object.keys(LINKS));
  const DEFAULT_CONFIG = Object.freeze({
    connected: Object.freeze({wan: false, core: true, desktop: true, ap: true, wifi: true, wired: true}),
    capacity: Object.freeze({wan: 12, core: 12, desktop: 8, ap: 6, wifi: 4, wired: 8}),
    laptopAccess: 'wifi'
  });
  const FLOWS = Object.freeze({
    desktop: Object.freeze({label: '台式机', links: Object.freeze(['wan', 'core', 'desktop'])}),
    laptop: Object.freeze({label: '笔记本', links: Object.freeze(['wan', 'core', 'ap', 'wifi'])})
  });

  function defaultConfig() {
    return {
      connected: {...DEFAULT_CONFIG.connected},
      capacity: {...DEFAULT_CONFIG.capacity},
      laptopAccess: DEFAULT_CONFIG.laptopAccess
    };
  }

  function assertConfig(config) {
    if (!config || typeof config !== 'object' || !config.connected || !config.capacity ||
        !['wifi', 'wired'].includes(config.laptopAccess)) throw new RangeError('Unsupported network configuration');
    if (LINK_IDS.some(id => typeof config.connected[id] !== 'boolean' || !RATE_OPTIONS.includes(config.capacity[id]))) {
      throw new RangeError('Unsupported network link configuration');
    }
  }

  function routesFor(config) {
    return {
      desktop: [...FLOWS.desktop.links],
      laptop: config.laptopAccess === 'wifi'
        ? [...FLOWS.laptop.links]
        : ['wan', 'core', 'wired']
    };
  }

  function inspect(config) {
    assertConfig(config);
    const routes = routesFor(config);
    const clients = {};
    for (const [client, links] of Object.entries(routes)) {
      const failedLink = links.find(id => !config.connected[id]);
      clients[client] = {
        reachable: failedLink === undefined,
        links,
        failedLink: failedLink || null,
        failedLabel: failedLink ? LINKS[failedLink].label : null
      };
    }
    return {routes, clients, allReachable: Object.values(clients).every(client => client.reachable)};
  }

  function simulate(config, fileSizeMB = 12) {
    assertConfig(config);
    if (!Number.isFinite(fileSizeMB) || fileSizeMB <= 0 || fileSizeMB > 100) {
      throw new RangeError('File size must be greater than 0 and no more than 100 MB');
    }
    const network = inspect(config);
    const activeClients = Object.keys(network.clients).filter(id => network.clients[id].reachable);
    const sharing = {};
    for (const id of LINK_IDS) {
      const users = activeClients.filter(client => network.routes[client].includes(id));
      sharing[id] = {
        activeFlows: users.length,
        shareMbps: users.length ? config.capacity[id] / users.length : null
      };
    }

    const clients = {};
    for (const [id, state] of Object.entries(network.clients)) {
      if (!state.reachable) {
        clients[id] = {...state, throughputMbps: null, seconds: null, bottlenecks: []};
        continue;
      }
      const shares = state.links.map(link => ({link, capacityMbps: sharing[link].shareMbps}));
      const throughputMbps = Math.min(...shares.map(item => item.capacityMbps));
      const bottlenecks = shares
        .filter(item => Math.abs(item.capacityMbps - throughputMbps) < 1e-9)
        .map(item => item.link);
      const megabits = fileSizeMB * 8;
      clients[id] = {
        ...state,
        throughputMbps,
        seconds: megabits / throughputMbps,
        bottlenecks
      };
    }
    return {
      clients,
      sharing,
      activeClients,
      allReachable: network.allReachable,
      fileSizeMB,
      fileSizeMbit: fileSizeMB * 8,
      assumptions: Object.freeze({equalSharing: true, fixedDemand: true, protocolOverhead: false})
    };
  }

  return {RATE_OPTIONS, LINKS, LINK_IDS, FLOWS, DEFAULT_CONFIG, defaultConfig, inspect, simulate};
});
