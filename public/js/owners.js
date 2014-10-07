var Owners = React.createClass({
  displayName: 'Owners',
  getInitialState: function() {
    return {};
  },
  componentDidMount: function() {

  },
  createMap: function() {
    $('#owners .usmap').vectorMap({
      map: 'usa_en',
      backgroundColor: null,
      color: '#ffffff',
      enableZoom: false,
      showTooltip: true
    });
  },
  render: function() {
    return (
      React.DOM.div(null,
        React.DOM.div('class=usmap')
      )
    );
  }
});

$(function() {
  React.renderComponent(Owners({}), document.getElementById('owners'));
});