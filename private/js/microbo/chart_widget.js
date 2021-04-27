(function() {

    /**
     * Chart widget from node si
     */
    window.chartWidget = function (data) {

        // CPU
        if ( data.settings.microbo.ui.chart_widget.hide == false ) {

            var radial_cpu_bar = new ProgressBar.Circle("#chart_cpu", {
                strokeWidth: 6,
                easing: 'easeInOut',
                duration: 1400,
                color: '#ffffff',
                trailColor: '#eeeeee',
                trailWidth: 1,
                svgStyle: null,
                text: {
                    autoStyleContainer: true
                },
                step: function(state, circle) {

                    var value = Math.round(circle.value() * 100);
                    if (value === 0) {
                        circle.setText('');
                    } else {
                        circle.setText(value);
                    }

                }
            });
            //radial_cpu_bar.animate(1.0);  // Number from 0.0 to 1.0

            // Mem
            var radial_mem_bar = new ProgressBar.Circle("#chart_mem", {
                strokeWidth: 6,
                easing: 'easeInOut',
                duration: 1400,
                color: '#ffffff',
                trailColor: '#eeeeee',
                trailWidth: 1,
                svgStyle: null,
                text: {
                    autoStyleContainer: true
                },
                step: function(state, circle) {

                    var value = Math.round(circle.value() * 100);
                    if (value === 0) {
                        circle.setText('');
                    } else {
                        circle.setText(value);
                    }

                }
            });
            //radial_mem_bar.animate(1.0);  // Number from 0.0 to 1.0

            // Net
            // Data
            var net_tx = new TimeSeries();
            var net_rx = new TimeSeries();

            // Net Transfer
            var chart_net = new SmoothieChart({
                maxValueScale: 1.1,                         // allows proportional padding to be added above the chart. for 10% padding, specify 1.1.
                minValueScale: 1.1,
                tooltip:true, 
                horizontalLines:[{color:'#eeeeee',lineWidth:0.5,value:0}],
                grid: { 
                    strokeStyle:'#495464', 
                    fillStyle:'#495464',
                },
                labels: {
                    disabled: true,                        // enables/disables labels showing the min/max values
                    fillStyle: '#ffffff',                   // colour for text of labels,
                    precision: 2,
                    showIntermediateLabels: false,          // shows intermediate labels between min and max values along y axis
                    intermediateLabelSameAxis: true,
                },
                millisPerPixel: 100,
                response: false,
                interpolation: 'bezier'                      // linear, step, bezier
            });
            
            // Stream to canvas
            chart_net.streamTo(document.getElementById("chart_net"), data.settings.microbo.ui.chart_widget.interval /*delay*/); 
            
            // Add to chart
            let color_rx = '#acc864';
            let color_tx = '#fd742d';
            if (data.settings.microbo.ui.chart_widget.colorless == true) {
                color_rx = '#ffffff';
                color_tx = '#ffffff';

                setTimeout(function(){ $('.smoothie-chart-tooltip').addClass('colorless'); }, 500);
                
            }

            chart_net.addTimeSeries(net_rx, { strokeStyle:color_rx, fillStyle:'rgba(0, 255, 0, 0.0)', lineWidth:2.5 });
            chart_net.addTimeSeries(net_tx, { strokeStyle:color_tx, fillStyle:'rgba(0, 255, 0, 0.0)', lineWidth:2.5 });

            // Update System Information
            update_si();
            function update_si(){
                setInterval(function(){
                    
                    read_si();

                }, data.settings.microbo.ui.chart_widget.interval);
            }

            // Read Sistem Information (si)
            read_si();
            async function read_si() {
                const response = await fetch('microbo/api/si', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({"hash": hash})
                })
                .then(res => res.json())
                .then(data => {   
                    return data;
                });

                //console.log(response);
                radial_cpu_bar.animate(response.cpu);
                radial_mem_bar.animate(response.mem);

                // Add a random value to each line every second
                net_rx.append(new Date().getTime(), response.net_rx/1024);
                net_tx.append(new Date().getTime(), response.net_tx/-1024);
            }
        }

	};    
    
})(jQuery);