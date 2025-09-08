package com.irkut.tc.mpdeditor.views;

import javax.swing.*;

import com.irkut.tc.ui.AddDataPanel;
import com.irkut.tc.ui.DisplayComponentLabel;
import com.irkut.tc.ui.UIHelper;
import com.irkut.tc.util.ComponentsExtractor;
import com.teamcenter.rac.common.genericselection.SelectComponentEvent;
import com.teamcenter.rac.common.genericselection.SelectComponentListener;
import com.teamcenter.rac.kernel.TCComponent;
import com.teamcenter.rac.kernel.TCComponentItem;
import com.teamcenter.rac.kernel.TCComponentItemRevision;
import com.teamcenter.rac.util.HorizontalLayout;
import com.teamcenter.rac.util.Separator;
import com.teamcenter.rac.util.VerticalLayout;

import java.awt.*;
import java.awt.event.*;
import java.util.*;
import java.util.List;

/**
 * DynamicFormPanel builds a Swing JPanel with three columns: label, value and applicability.
 * Values can be extracted via getFormValues() and getApplyValues().
 */
public class MPDEDynamicForm extends JPanel implements IUpdaterInfoCode {
    private JComboBox<String> infoCodeField;
    private JPanel formPanel;
    private JScrollPane scrollPane;
    private Map<String, JComponent> fieldComponents = new LinkedHashMap<>();
    private Map<String, JComponent> applyComponents = new LinkedHashMap<>();
    private Map<String, List<FieldConfig>> formConfigs = new HashMap<>();

    public MPDEDynamicForm() {
        super(new BorderLayout(5,5));
        initFormConfigs();
        initUI();
        
    }
    
    // TODO: сделать класс в который просто название передавать
    private class TCCBasisExtractor implements ComponentsExtractor {

		@Override
		public List<TCComponent> extract(TCComponent src) {
			List<TCComponent> lst = new ArrayList<>();
			try {
				if (src instanceof TCComponentItem) {
					if (src.getStringProperty("object_type").equals("IRM8_CBasis")) {
						lst.add(src);

					}
				} else if (src instanceof TCComponentItemRevision) {
					TCComponentItem item = ((TCComponentItemRevision) src).getItem();
					if (item.getStringProperty("object_type").equals("IRM8_CBasis"))
						lst.add(item);
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
			return lst;
		}

	}

    private void initFormConfigs() {
    	
    	
    	
    	
        formConfigs.put("OB2A", Arrays.asList(
            new FieldConfig("systemZone","Система (Основная зона)",FieldType.TEXT),
            new FieldConfig("subZone","Подсистема (Подзона)",FieldType.TEXT),
            new FieldConfig("taskNumber","Номер задачи ИДПТО",FieldType.TEXT)
        ));
        formConfigs.put("OB4A", Arrays.asList(
            new FieldConfig("revisionStatus","Статус ревизии",FieldType.COMBO,"New","In Progress","Done"),
            new FieldConfig("taskCode","Код задачи",FieldType.TEXT),
            new FieldConfig("description","Описание задачи",FieldType.TEXTAREA)
        ));
        formConfigs.put("OB1A", Arrays.asList(
        		new FieldConfig("systemZone","Подсистема",FieldType.TCCOMPONENT),
                new FieldConfig("taskCode","Код задачи",FieldType.TEXT),
                new FieldConfig("description","Описание задачи",FieldType.TEXTAREA)
            ));
        formConfigs.put("OB1C", Arrays.asList(
                new FieldConfig("revisionStatus","Статус ревизии",FieldType.COMBO,"New","In Progress","Done"),
                new FieldConfig("taskCode","Код задачи",FieldType.TEXT),
                new FieldConfig("description","Описание задачи",FieldType.TEXTAREA)
            ));
        formConfigs.put("", Collections.emptyList());
    }

    private void initUI() {
    	setLayout(new VerticalLayout(5,5,5,5,5));
        JPanel top = new JPanel(new FlowLayout(FlowLayout.LEFT));
        top.add(new JLabel("Инфокод:"));
        String codes[] = { "OB2A", "OB4A", "OB1A", "OB1B", "OB1C" };
        infoCodeField = new JComboBox<String>(codes);
        
        top.add(infoCodeField);
        JButton apply = new JButton("Применить");
        top.add(apply);

        formPanel = new JPanel(new GridBagLayout());
        scrollPane = new JScrollPane(formPanel);
        add(scrollPane, "top.bind.left.left");
        add(new Separator(), "top.bind.left.left");
        add(top, "top.bind.left.left");
        

        apply.addActionListener(e -> rebuildForm());
    }

    private void rebuildForm() {
    	
    	DisplayComponentLabel displayComponentLabel = new DisplayComponentLabel();
        SelectComponentListener selListener = new SelectComponentListener() {
    		@Override
    		public void processSelectComponent(SelectComponentEvent ev) {
    			if (ev.getComponent() instanceof TCComponentItem) {
    				try {
    					TCComponentItem item = (TCComponentItem) ev.getComponent();
    					if (item.getStringProperty("object_type").equals("IRM8_CBasis"))
    						displayComponentLabel.setTCComponent(item);
    				} catch (Exception e) {
    					e.printStackTrace();
    				}
    			} else if (ev.getComponent() instanceof TCComponentItemRevision) {
    				try {
    					TCComponentItem item = ((TCComponentItemRevision) ev.getComponent()).getItem();
    					if (item.getStringProperty("object_type").equals("IRM8_CBasis"))
    						displayComponentLabel.setTCComponent(item);
    				} catch (Exception e) {
    					e.printStackTrace();
    				}
    			}
    		}
    	};
    	AddDataPanel addDataPanel;
    	
    	addDataPanel = new AddDataPanel(new TCCBasisExtractor());
    	addDataPanel.addSelectComponentListener(selListener);
    	
    	JButton removeButton = UIHelper.createIconButton(UIHelper.getRemoveIcon(), "Удаление сертификационного базиса");
		removeButton.addActionListener(new ActionListener() {
			@Override
			public void actionPerformed(ActionEvent e) {
				displayComponentLabel.setTCComponent(null);
			}
		});
		
		JPanel displayPanel = new JPanel(); // TODO: сделать фабрику
		displayPanel.setLayout(new HorizontalLayout(5, 0, 0, 0, 0));

		displayPanel.add("left.nobind.left.center", displayComponentLabel);
		displayPanel.add("right.nobind.center.center", removeButton);
		displayPanel.add("right.nobind.center.center", addDataPanel);
    	
    	System.out.println("rebuildForm");
        String code = (String) infoCodeField.getSelectedItem();
        List<FieldConfig> configs = formConfigs.getOrDefault(code, formConfigs.get(""));

        formPanel.removeAll();
        fieldComponents.clear();
        applyComponents.clear();
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(4,4,4,4);
        gbc.anchor = GridBagConstraints.WEST;
        gbc.fill = GridBagConstraints.HORIZONTAL;

        gbc.gridy=0;
        gbc.gridx=0; formPanel.add(new JLabel("Наименование поля"),gbc);
        gbc.gridx=1; formPanel.add(new JLabel("Значение"),gbc);
        gbc.gridx=2; formPanel.add(new JLabel("Применимость"),gbc);

        int row=1;
        for(FieldConfig cfg:configs){
            gbc.gridy=row;
            gbc.gridx=0; gbc.weightx=0.2;
            formPanel.add(new JLabel(cfg.label),gbc);

            gbc.gridx=1; gbc.weightx=0.5;
            JComponent valComp;
            switch(cfg.type){
                case TEXTAREA: valComp=new JScrollPane(new JTextArea(3,20));break;
                case COMBO:    valComp=new JComboBox<>(cfg.options.toArray(new String[0]));break;
                case CHECKBOX: valComp=new JCheckBox();break;
                case TCCOMPONENT: valComp = displayPanel; break;
                case TEXT:
                default:       valComp=new JTextField(20);
            }
            formPanel.add(valComp,gbc);
            fieldComponents.put(cfg.key,valComp);

            gbc.gridx=2; gbc.weightx=0.3;
            JPanel ap=new JPanel(new FlowLayout(FlowLayout.LEFT,0,0));
            JComboBox<String> cb=new JComboBox<>(new String[]{""});
            JButton add=new JButton("+");
            ap.add(cb);ap.add(add);
            formPanel.add(ap,gbc);
            applyComponents.put(cfg.key,cb);
            row++;
        }
        formPanel.revalidate();formPanel.repaint();
    }

    public Map<String,Object> getFormValues(){
        Map<String,Object> m=new HashMap<>();
        fieldComponents.forEach((k,c)->{
            Object v=null;
            if(c instanceof JTextField) v=((JTextField)c).getText();
            else if(c instanceof JScrollPane) v=((JTextArea)((JScrollPane)c).getViewport().getView()).getText();
            else if(c instanceof JComboBox) v=((JComboBox<?>)c).getSelectedItem();
            else if(c instanceof JCheckBox) v=((JCheckBox)c).isSelected();
            m.put(k,v);
        });
        return m;
    }

    public Map<String,Object> getApplyValues(){
        Map<String,Object> m=new HashMap<>();
        applyComponents.forEach((k,c)->{
            Object v=null;
            if(c instanceof JComboBox) v=((JComboBox<?>)c).getSelectedItem();
            m.put(k,v);
        });
        return m;
    }

    // Helper types
    enum FieldType{TEXT,TEXTAREA,COMBO,CHECKBOX, TCCOMPONENT}
    static class FieldConfig{String key,label;FieldType type;List<String> options;
        FieldConfig(String k,String l,FieldType t,String...o){key=k;label=l;type=t;options = o != null ? Arrays.asList(o) : Collections.emptyList();}}
    /**
     * Standalone runner
     */
//    public static void main(String[] args){
//        SwingUtilities.invokeLater(()->{
//            JFrame f=new JFrame("Dynamic SWT_AWT Demo");
//            f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
//            f.getContentPane().add(new DynamicFormPanel());
//            f.setSize(600,400);
//            f.setLocationRelativeTo(null);
//            f.setVisible(true);
//        });
//    }

	@Override
	public void updateInfoCode(String code) {
		// TODO Auto-generated method stub
		
	}

    /**
     * Example of embedding in SWT composite:
     *
     * Composite composite = new Composite(parent, SWT.EMBEDDED);
     * Frame awtFrame = SWT_AWT.new_Frame(composite);
     * DynamicFormPanel panel = new DynamicFormPanel();
     * awtFrame.add(panel);
     */
}
