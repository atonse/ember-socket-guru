import { Socket } from 'phoenix';
import Ember from 'ember';

const {
  get, set, setProperties, assert, run, warn,
} = Ember;

export default Ember.Object.extend({
  Socket,
  joinedChannels: {},

  setup(config, eventHandler) {
    this._checkConfig(config);
    const SocketService = get(this, 'Socket');
    const connectParams = get(config, 'connectParams') || {};
    const socket = new SocketService(get(config, 'socketAddress'), { params: connectParams });
    socket.connect();
    setProperties(this, { socket, eventHandler });
  },

  subscribe(observedChannels) {
    Object.keys(observedChannels).forEach((channelName) => {
      const channel = get(this, 'socket').channel(channelName);
      const joinedChannels = get(this, 'joinedChannels');
      channel.join();
      set(this, 'joinedChannels', Object.assign({}, joinedChannels, {
        [channelName]: channel,
      }));
      this._attachEventsToChannel(channel, channelName, observedChannels[channelName]);
    });
  },

  unsubscribeChannels(channelsToUnsubscribe) {
    Object.keys(channelsToUnsubscribe)
      .forEach(channel => get(this, `joinedChannels.${channel}`).leave());
  },

  emit(channelName, eventName, eventData) {
    const channel = get(this, `joinedChannels.${channelName}`);
    if (!channel) {
      return warn(
        `[ember-socket-guru] You need to join channel ${channelName} before pushing events!`,
        channel,
        { id: 'ember-socket-guru.channel-not-joined' }
      );
    }
    channel.push(eventName, eventData);
  },

  disconnect() {
    get(this, 'socket').disconnect();
  },

  _checkConfig(config) {
    assert(
      '[ember-sockets-guru] You need to provide socketAddress in the socket-guru service',
      !!get(config, 'socketAddress')
    );
  },

  _attachEventsToChannel(channel, channelName, events) {
    events.forEach((event) => {
      channel.on(event, (data) => {
        run(() => get(this, 'eventHandler')(event, data));
      });
    });
  },
});
