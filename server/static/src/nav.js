// @flow

var Router = ReactRouter;
var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

var App = React.createClass({
	componentDidMount: function() {
		this.startWS();
	},
	startWS: function() {
		var ws = new WebSocket('ws://' + window.location.host + '/ws/');
		ws.onmessage = function(e) {
			var d = JSON.parse(e.data);
			if (Actions[d.Type]) {
				Actions[d.Type](d.Data);
			} else {
				console.log("missing action", d.Type);
			}
		};
		ws.onclose = function() {
			setTimeout(this.startWS, 1000);
		}.bind(this);
	},
	render: function() {
		return (
			<div>
				<header>
					<ul>
						<li><Link to="app">Music</Link></li>
						<li><Link to="protocols">Sources</Link></li>
					</ul>
				</header>
				<main>
					<RouteHandler/>
				</main>
				<footer>
					<Player/>
				</footer>
			</div>
		);
	}
});

var Player = React.createClass({
	mixins: [Reflux.listenTo(Stores.status, 'setState')],
	cmd: function(cmd) {
		return function() {
			POST('/api/cmd/' + cmd);
		};
	},
	getInitialState: function() {
		return {};
	},
	render: function() {
		var status;
		if (!this.state.Song) {
			status = <span>unknown</span>;
		} else {
			status = (
				<span>
					<span>pl: {this.state.Playlist}</span>
					<span>state: {this.state.State}</span>
					<span>elapsed: <Time time={this.state.Elapsed} /></span>
					<span>time: <Time time={this.state.Time} /></span>
					<span>song: {this.state.Song}</span>
				</span>
			);
		};

		var play;
		switch(this.state.State) {
			case 0:
				play = '▐▐';
				break;
			case 2:
			default:
				play = '\u25b6';
				break;
		}
		return (
			<div>
				<span><button onClick={this.cmd('prev')}>⇤</button></span>
				<span><button onClick={this.cmd('pause')}>{play}</button></span>
				<span><button onClick={this.cmd('next')}>⇥</button></span>
				<span>{status}</span>
			</div>
		);
	}
});

var routes = (
	<Route name="app" path="/" handler={App}>
		<DefaultRoute handler={TrackList}/>
		<Route name="protocols" handler={Protocols}/>
	</Route>
);

Router.run(routes, Router.HistoryLocation, function (Handler) {
	React.render(<Handler/>, document.getElementById('main'));
});