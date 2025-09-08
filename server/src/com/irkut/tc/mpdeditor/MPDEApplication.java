package com.irkut.tc.mpdeditor;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

import javax.swing.JPanel;

import com.irkut.tc.mpdeditor.views.IUpdaterInfoCode;
import com.teamcenter.rac.common.AbstractTCApplication;
import com.teamcenter.rac.kernel.TCComponentBOMViewRevision;
import com.teamcenter.rac.kernel.TCComponentItem;
import com.teamcenter.rac.kernel.TCComponentItemRevision;
import com.teamcenter.rac.kernel.TCComponentViewType;
import com.teamcenter.rac.kernel.TCException;

public class MPDEApplication extends AbstractTCApplication{

	public MPDEApplication() throws Exception {
		super();
		// TODO Auto-generated constructor stub
	}
	
	private ArrayList<IUpdaterInfoCode> updaters; // TODO: временное решение
	public void addUpdaters(IUpdaterInfoCode updater) {
//		updaters.add(updater);
	}
	
	public ArrayList<IUpdaterInfoCode> getUpdaters() {
		return updaters;
	}

	private static String MPDE_VIEW_TYPE_NAME = "view";
	private static TCComponentViewType	MPDE_VIEW_TYPE = null;
	
	private static HashSet<String> ENABLED_NEW_ACTIONS;

	public static String[] getCustomFields() {

        return new String[] {"", "0B3A", "0B4A", "0B1A", "941", "041"};
	}
	
	public static String currentCode = "";
	
}

