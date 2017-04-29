var Owners = React.createClass({
  displayName: 'Owners',
  getInitialState() {
    return {};
  },
  componentDidMount() {

  },
  createMap() {
    $('#owners .usmap').vectorMap({
      map: 'usa_en',
      backgroundColor: null,
      color: '#ffffff',
      enableZoom: false,
      showTooltip: true
    });
  },
  render() {
    return (
      React.DOM.div(null,
        React.DOM.div('class=usmap')
      )
    );
  }
});

$(() => {
  React.renderComponent(Owners({}), document.getElementById('owners'));
});