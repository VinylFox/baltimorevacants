<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html lang="en">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>Baltimore Vacants</title>
        <meta name="author" content="Shea Frederick">
        <link rel="stylesheet" href="/static/resources/stylesheets/leaflet.css">
        <link rel="stylesheet" href="/static/resources/stylesheets/jquery-ui-1.10.4.custom.min.css">
        <link rel="stylesheet" href="/static/resources/stylesheets/screen.css">
        <link rel="stylesheet" href="/static/js/fancybox/jquery.fancybox-1.3.4.css" type="text/css" media="screen" />

        <script type="application/javascript" src="/static/js/jquery-1.8.3.min.js"></script>
        <script type="application/javascript" src="/static/js/leaflet.js"></script>
        <script type="application/javascript" src="/static/js/d3.js"></script>
        <script type="application/javascript" src="/static/js/jquery-ui-1.10.4.custom.min.js"></script>
        <script>var STARTLOC = '<?php if(isset($_GET['loc'])){ print $_GET['loc']; } ?>';</script>
        <script type="application/javascript" src="/static/js/site.js?ver=1"></script>
        <script type="application/javascript" src="http://platform.twitter.com/widgets.js"></script>
        <script type="application/javascript" src="http://maps.googleapis.com/maps/api/js?sensor=false"></script>
        <script type="application/javascript" src="/static/js/fancybox/jquery.fancybox-1.3.4.js"></script>
        <script type="application/javascript" src="/static/js/fancybox/jquery.easing-1.3.pack.js"></script>
        <script type="application/javascript" src="/static/js/raphael-min.js"></script>
        <script type="application/javascript" src="/static/js/pie.min.js"></script>
    </head>
    <body>
        <div id="bnia-details">
            <div class="bnia-area-title">Community Statistical Area</div>
            <div class="bnia-stat-column left">
                <div class="bnia-stat-title">Gender</div>
                <div class="bnia-stat-data" id="bnia-sex"></div>
                <div class="bnia-stat-title">Ethnicity</div>
                <div class="bnia-stat-data" id="bnia-race"></div>
                <div class="bnia-stat-title">Age</div>
                <div class="bnia-stat-data" id="bnia-age"></div>
            </div>
            <div class="bnia-stat-column right">
                <div class="bnia-stat-label">Household Size: </div><div class="bnia-stat-value" id="hhsize10"></div>
                <div class="bnia-stat-label">Household Income: </div><div class="bnia-stat-value" id="mhhi10"></div>
                <div class="bnia-stat-label">Home Price:</div><div class="bnia-stat-value" id="salepr10"></div>
                <div class="bnia-stat-label">Days on the Market:</div><div class="bnia-stat-value" id="dom10"></div>
                <div class="bnia-stat-label">Number of Homes Sold:</div><div class="bnia-stat-value" id="shomes10"></div>
                <div class="bnia-stat-label">Owner-Occupied Homes:</div><div class="bnia-stat-value" id="ownroc10"></div>
                <div class="bnia-stat-label">Mortgage Foreclosure:</div><div class="bnia-stat-value" id="fore10"></div>
                <div class="bnia-stat-label">Vacant and Abandoned:</div><div class="bnia-stat-value" id="vacant10"></div>
                <div class="bnia-stat-label">Housing Violations:</div><div class="bnia-stat-value" id="vio10"></div>
                <div class="bnia-stat-label">Major Rehabilitation:</div><div class="bnia-stat-value" id="resrehab10"></div>
                <div class="bnia-stat-label">Residential Properties:</div><div class="bnia-stat-value" id="totalres10"></div>
                <div class="bnia-stat-label">High School Completion:</div><div class="bnia-stat-value" id="compl10"></div>
                <div class="bnia-stat-label">Liquor Outlet density:</div><div class="bnia-stat-value" id="liquor10"></div>
                <div class="bnia-stat-label">Unemployment Rate:</div><div class="bnia-stat-value" id="unempr10"></div>
                <div class="bnia-compare"><a id="bniacompare" href="#bnia-compare">Compare to:</a> <input id="comparesearch" type="text" name="compare-to"/></div>
                <a href="http://bniajfi.org/communities" target="_blank"><div class="bnia-logo"></div></a>
            </div>
        </div>
        <form id="home-search" onsubmit="$('#btn-submit').click();return false;">
        <div id="main">
            <div class="detail-box" id="detail-box">
                <span>Select a property</span>
            </div>
            <div class="map-contain">
                <div class="header">
                    <div class="title-contain">
                        <h1>Baltimore Vacants</h1>
                    </div>
                    <div class="search-controls">
                        <div class="search-contain">
                            <div class="search">
                                <div id="search-box">
                                    <input type="text" id="address" name="address" class="search-input" autocomplete="off" placeholder="Enter Baltimore city address" />
                                    <input type="submit" id="btn-submit" value="Submit" class="btn-submit" />
                                </div>
                            </div>
                            <div class="option-controls">
                                <div class="options">
                                    <label class="section-label">Type:</label>
                                    <input type="checkbox" id="check1" checked />
                                    <label for="check1" class="btn btn-house group first">House</label>
                                    <input type="checkbox" id="check2" />
                                    <label for="check2" class="btn-lot btn group last">Lot</label>
                                    <label class="section-label">Show:</label>
                                    <input type="checkbox" id="check3" />
                                    <label for="check3" class="btn btn-crime">Crime</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="lmap-wrap">
                    <div id="lmapcontainer" style="width:500px;height:500px;"></div>
                </div>
                <div class="footer">
                    <div class="footer-credit">
                        <a id="credits" href="#credit-text">Developer Credits</a> &nbsp;&nbsp;&nbsp;  |  &nbsp;&nbsp;&nbsp;  Data provided through <a href="http://data.baltimorecity.gov/" target="parent">Open Baltimore</a>  &nbsp;&nbsp;&nbsp; |  &nbsp;&nbsp;&nbsp;  Map by <a href="http://www.openstreetmap.org/copyright" target="parent">&copy; OpenStreetMap contributors</a>
                    </div>
                    <div class="footer-social">
                        <p>
                            Spread the word:
                        </p>
                        <span><a href="http://twitter.com/share" class="twitter-share-button" data-url="http://www.baltimorevacants.org/" data-via="bmorevacants" data-text="Search for vacant houses and lots through out the city of Baltimore" data-count="horizontal">Tweet</a></span>
                        <iframe src="http://www.facebook.com/plugins/like.php?href=http%3A%2F%2Fwww.baltimorevacants.org&amp;layout=button_count&amp;show_faces=false&amp;width=100&amp;action=like&amp;colorscheme=light&amp;height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:100px; height:20px;" allowTransparency="true"></iframe>
                    </div>
                </div>
            </div>
            <div id="sb-contain">
                <div class="left-v-shadow"></div>
                <div class="search-result">
                    <span id="result-value" class="result-value">...</span>
                    <span class="result-label">Matching results</span>
                </div>
                <div id="sb-contents">
                    <ul id="results-list"></ul>
                    <div class="text-btn next" id="btn-next">
                        <a href="#">Next 25</a>
                    </div>
                    <div id="too-many" class="too-many">
                        <span class="exclaim">!</span>
                        <p class="lrg-text">
                            Too many results to list.
                        </p>
                        <p>
                            Enter a Baltimore City address or zoom in closer.
                        </p>
                    </div>
                    <div id="initial" class="initial">
                        <p>
                            Enter a Baltimore City address
                        </p>
                    </div>
                    <div id="loading" class="loading"></div>
                </div>
            </div>
        </div>
        <div style="display:none">
            <div id="bnia-compare">
                <div class="compare-left">
                    <div id="bnia-details_left" style="position: relative; top:0; left:0;">
                        <div class="bnia-area-title">Community Statistical Area</div>
                        <div class="bnia-stat-column left">
                            <div class="bnia-stat-title">Gender</div>
                            <div class="bnia-stat-data" id="bnia-sex_left"></div>
                            <div class="bnia-stat-title">Ethnicity</div>
                            <div class="bnia-stat-data" id="bnia-race_left"></div>
                            <div class="bnia-stat-title">Age</div>
                            <div class="bnia-stat-data" id="bnia-age_left"></div>
                        </div>
                        <div class="bnia-stat-column right">
                            <div class="bnia-stat-label">Household Size: </div><div class="bnia-stat-value" id="hhsize10_left"></div>
                            <div class="bnia-stat-label">Household Income: </div><div class="bnia-stat-value" id="mhhi10_left"></div>
                            <div class="bnia-stat-label">Home Price:</div><div class="bnia-stat-value" id="salepr10_left"></div>
                            <div class="bnia-stat-label">Days on the Market:</div><div class="bnia-stat-value" id="dom10_left"></div>
                            <div class="bnia-stat-label">Number of Homes Sold:</div><div class="bnia-stat-value" id="shomes10_left"></div>
                            <div class="bnia-stat-label">Owner-Occupied Homes:</div><div class="bnia-stat-value" id="ownroc10_left"></div>
                            <div class="bnia-stat-label">Mortgage Foreclosure:</div><div class="bnia-stat-value" id="fore10_left"></div>
                            <div class="bnia-stat-label">Vacant and Abandoned:</div><div class="bnia-stat-value" id="vacant10_left"></div>
                            <div class="bnia-stat-label">Housing Violations:</div><div class="bnia-stat-value" id="vio10_left"></div>
                            <div class="bnia-stat-label">Major Rehabilitation:</div><div class="bnia-stat-value" id="resrehab10_left"></div>
                            <div class="bnia-stat-label">Residential Properties:</div><div class="bnia-stat-value" id="totalres10_left"></div>
                            <div class="bnia-stat-label">High School Completion:</div><div class="bnia-stat-value" id="compl10_left"></div>
                            <div class="bnia-stat-label">Liquor Outlet density:</div><div class="bnia-stat-value" id="liquor10_left"></div>
                            <div class="bnia-stat-label">Unemployment Rate:</div><div class="bnia-stat-value" id="unempr10_left"></div>
                        </div>
                    </div>
                </div>
                <div class="compare-right">
                    <div id="bnia-details_right" style="position: relative; top:0; left:0;">
                        <div class="bnia-area-title">Community Statistical Area</div>
                        <div class="bnia-stat-column left">
                            <div class="bnia-stat-title">Gender</div>
                            <div class="bnia-stat-data" id="bnia-sex_right"></div>
                            <div class="bnia-stat-title">Ethnicity</div>
                            <div class="bnia-stat-data" id="bnia-race_right"></div>
                            <div class="bnia-stat-title">Age</div>
                            <div class="bnia-stat-data" id="bnia-age_right"></div>
                        </div>
                        <div class="bnia-stat-column right">
                            <div class="bnia-stat-label">Household Size: </div><div class="bnia-stat-value" id="hhsize10_right"></div>
                            <div class="bnia-stat-label">Household Income: </div><div class="bnia-stat-value" id="mhhi10_right"></div>
                            <div class="bnia-stat-label">Home Price:</div><div class="bnia-stat-value" id="salepr10_right"></div>
                            <div class="bnia-stat-label">Days on the Market:</div><div class="bnia-stat-value" id="dom10_right"></div>
                            <div class="bnia-stat-label">Number of Homes Sold:</div><div class="bnia-stat-value" id="shomes10_right"></div>
                            <div class="bnia-stat-label">Owner-Occupied Homes:</div><div class="bnia-stat-value" id="ownroc10_right"></div>
                            <div class="bnia-stat-label">Mortgage Foreclosure:</div><div class="bnia-stat-value" id="fore10_right"></div>
                            <div class="bnia-stat-label">Vacant and Abandoned:</div><div class="bnia-stat-value" id="vacant10_right"></div>
                            <div class="bnia-stat-label">Housing Violations:</div><div class="bnia-stat-value" id="vio10_right"></div>
                            <div class="bnia-stat-label">Major Rehabilitation:</div><div class="bnia-stat-value" id="resrehab10_right"></div>
                            <div class="bnia-stat-label">Residential Properties:</div><div class="bnia-stat-value" id="totalres10_right"></div>
                            <div class="bnia-stat-label">High School Completion:</div><div class="bnia-stat-value" id="compl10_right"></div>
                            <div class="bnia-stat-label">Liquor Outlet density:</div><div class="bnia-stat-value" id="liquor10_right"></div>
                            <div class="bnia-stat-label">Unemployment Rate:</div><div class="bnia-stat-value" id="unempr10_right"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="credit-text">
                <h2>Developed with care and a passion for Baltimore</h2>
                <p class="spread-word">
                    Spread the word: <span><a href="http://twitter.com/share" class="twitter-share-button" data-url="http://www.baltimorevacants.org/" data-via="bmorevacants" data-text="Search for vacant houses and lots through out the city of Baltimore" data-count="horizontal">Tweet</a></span><iframe src="http://www.facebook.com/plugins/like.php?href=http%3A%2F%2Fwww.baltimorevacants.org&amp;layout=button_count&amp;show_faces=false&amp;width=100&amp;action=like&amp;colorscheme=light&amp;height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:100px; height:20px;" allowTransparency="true"></iframe>
                </p>
                <p>
                    Blight is a major issue for many American cities, particularly those who have undergone major economic and cultural changes since the mid 20th centruy.
                </p>
                <p>
                    The goal of this application is to shed light on the current situation in Baltimore. Far too many homes are unoccupied and as a result draining city resources, not providing annual tax revenue and presenting other health and safety issues for citizens.
                </p>
                <p>
                    Help support Open Data and Baltimore by sharing this app with your friends, family and those willing to make an investment in this city.
                </p>
                <p>
                    Thank you,
                </p>
                <div class="name">
                    <div class="name-pic"></div>
                    <p class="strong">
                        Shea Frederick
                    </p>
                    <p>
                        <a href="https://twitter.com/vinylfox" class="twitter-follow-button" data-show-count="false">Follow @vinylfox</a>
                    </p>
                    <p>
                        Web Developer
                    </p>
                    <p>
                        Baltimore resident
                    </p>
                </div>
                <div class="name">
                    <div class="name-pic"></div>
                    <p class="strong">
                        James Schaffer
                    </p>
                    <p>
                        <a href="https://twitter.com/james_schaffer" class="twitter-follow-button" data-show-count="false">Follow @james_schaffer</a>
                    </p>
                    <p>
                        Web Designer
                    </p>
                    <p>
                        Baltimore resident
                    </p>
                </div>
                <div class="clear"></div>
            </div>
        </div>
        </form>
        <script>
            ! function(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if(!d.getElementById(id)) {
                    js = d.createElement(s);
                    js.id = id;
                    js.src = "//platform.twitter.com/widgets.js";
                    fjs.parentNode.insertBefore(js, fjs);
                }
            }(document, "script", "twitter-wjs");
        </script>
        <!-- GOOGLE ANALYTICS -->
        <script type="text/javascript">
            var _gaq = _gaq || [];
            _gaq.push(['_setAccount', 'UA-26641992-1']);
            _gaq.push(['_setDomainName', 'baltimorevacants.org']);
            _gaq.push(['_setAllowLinker', true]);
            _gaq.push(['_trackPageview']); (function() {
                var ga = document.createElement('script');
                ga.type = 'text/javascript';
                ga.async = true;
                ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
                var s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(ga, s);
            })();
        </script>
    </body>
</html>
