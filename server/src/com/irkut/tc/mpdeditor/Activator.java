package com.irkut.tc.mpdeditor;

import org.eclipse.jface.resource.ImageDescriptor;
import org.eclipse.ui.plugin.AbstractUIPlugin;
import org.osgi.framework.BundleContext;

import com.irkut.tc.mpdeditor.server.SparkServer;
import com.teamcenter.rac.kernel.AbstractRACPlugin;
import com.teamcenter.rac.services.IAspectService;
import com.teamcenter.rac.services.IAspectUIService;
import com.teamcenter.rac.util.OSGIUtil;


/**
 * The activator class controls the plug-in life cycle
 */
public class Activator extends AbstractRACPlugin {

	// The plug-in ID
		public static final String PLUGIN_ID = "com.irkut.tc.mpdeditor";
		// The shared instance
		private static Activator plugin;	
		
		private static MPDEApplication application;
		
		private static SparkServer sparkServer= null;
		
		public static MPDEApplication getApplication() {
			if (application == null) {
				try {
					application = new MPDEApplication();
				} catch (Exception e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
			return application;
		}
		/**
		 * The constructor
		 */
		public Activator() {
		}

		/*
		 * (non-Javadoc)
		 * @see org.eclipse.ui.plugin.AbstractUIPlugin#start(org.osgi.framework.BundleContext)
		 */
		public void start(BundleContext context) throws Exception {
			super.start(context);
			plugin = this;
		}

		/*
		 * (non-Javadoc)
		 * @see org.eclipse.ui.plugin.AbstractUIPlugin#stop(org.osgi.framework.BundleContext)
		 */
		public void stop(BundleContext context) throws Exception {
			plugin = null;
			
			sparkServer.stop();
			super.stop(context);
		}

		/**
		 * Returns the shared instance
		 *
		 * @return the shared instance
		 */
		public static Activator getDefault() {
			return plugin;
		}

		/**
		 * Returns an image descriptor for the image file at the given
		 * plug-in relative path
		 *
		 * @param path the path
		 * @return the image descriptor
		 */
		public ImageDescriptor getImageDescriptor(String path) {
			return imageDescriptorFromPlugin(PLUGIN_ID, path);
		}

		@Override
		public IAspectService getLogicService() {
			// TODO Auto-generated method stub
			return null;
		}

		@Override
		public IAspectUIService getUIService() {
			// TODO Auto-generated method stub
			return null;
		}
		public static void startSparkService() {
			// TODO Auto-generated method stub
			if (sparkServer == null) {
				sparkServer = new SparkServer();
			}
			
		}

}
