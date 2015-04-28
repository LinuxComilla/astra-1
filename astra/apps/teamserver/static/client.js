function AstraClient(url) {
    var client = this;

    this.socket = new WebSocket(url);

    this.socket.onopen = function() {
        client.onopen();
        client.hello('astra');
    };

    this.socket.onmessage = function(evt) {
        client.onmessage(evt.data);

        var data = JSON.parse(evt.data);
        console.log(data);
        switch(data.msg_type) {
            case 'welcome':
                client.session_id = data.session_id;
                break;

            case 'subscribed':
                var request = this.pending_requests[data.request_id];
                delete this.pending_requests[data.request_id];
                this.subscriptions[request.topic] = data.subscription_id;
                break;

            case 'published':
                var request = this.pending_requests[data.request_id];
                delete this.pending_requests[data.request_id];
                break;

            case 'error':
                var request = this.pending_requests[data.request_id];
                delete this.pending_requests[data.request_id];
                console.error(data);
                break;

            case 'abort':
                alert('Session establishment failed: ' + data.details.message);
                break;
        }
    };

    this.subscriptions = {};
    this.pending_requests = {};

    this.onopen = function() {};
    this.onmessage = function(data) {};

    this.next_request_id = 0;
}

AstraClient.prototype.getRequestId = function() {
    return this.next_request_id++;
};

AstraClient.prototype.subscribe = function(topic) {
    var msg = {
        'msg_type': 'subscribe',
        'request_id': this.getRequestId(),
        'options': {},
        'topic': topic
    };

    this.pending_requests[msg['request_id']] = msg;
    this.socket.send(JSON.stringify(msg));
};

AstraClient.prototype.hello = function(realm) {
    var msg = {
        'msg_type': 'hello',
        'realm': realm,
        'details': {
            'roles': {
                'publisher': {},
                'subscriber': {}
            }
        }
    };

    this.socket.send(JSON.stringify(msg));
};

AstraClient.prototype.publish = function(channel, message) {
    var msg = {
        'type': 'publish',
        'channel': channel,
        'message': message
    };

    this.socket.send(JSON.stringify(msg));
};

AstraClient.prototype.call = function(func_name, args, kwargs) {
    var msg = {
        'type': 'call',
        'function': func_name,
        'args': args,
        'kwargs': kwargs
    };

    this.socket.send(JSON.stringify(msg));
};
