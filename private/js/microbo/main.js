// Read Data
const main = async () => {

    // Read Data
    const response = await fetch('microbo/api/data', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"hash": hash, "select": "_all"})
    });
    const data = await response.json();

    // On Load
    // Call Microbo functions
    chartWidget(data);  // Chart widget

    
    // Create Router
    var routes = {};

    var defaultRoute = data.settings.microbo.jqrouter.routes.jsonstorage.alias;

    for (const [key, elem] of Object.entries(data.settings.microbo.jqrouter.routes)) {
        //console.log(`${key}: ${elem}`);
        //console.log(elem.alias);
        
        routes[elem.alias] = {
            url: '#/' + elem.alias,
            templateUrl: 'microbo/tpl/' + elem.tpl,
            cache: elem.cache
        };
    }

    $.router.setData(routes).setDefault(defaultRoute);
    $.when($.ready).then(function() {$.router.run('.view', defaultRoute)});

    // Router Events
    // This event is trigged when view is loaded in to dom & either controller or viewmodel can be initiated.
    $.router.onViewChange( function(e, viewRoute, route, params){
        // Debug
        console.log(route);

        // Page: ALL
        setActiveMenu(route.name);

        // Page: JSON STORAGE
        if (route.name == data.settings.microbo.jqrouter.routes.jsonstorage.alias) {

            // Call Microbo functions
            actions(data.settings.base_url); // Actions                
            jsoneditor(data); // Jsoneditor

        }

    });    
}
