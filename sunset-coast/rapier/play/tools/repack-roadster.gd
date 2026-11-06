# Called by rebuild-roadster-pack.py with verified extracted input resources.
extends SceneTree
func _initialize():
    var args = OS.get_cmdline_user_args()
    var folder = args[0]
    var entries = JSON.parse_string(FileAccess.get_file_as_string(folder.path_join("entries.json")))
    var packer = PCKPacker.new()
    assert(packer.pck_start(args[1]) == OK)
    for entry in entries:
        assert(packer.add_file("res://" + entry, folder.path_join(entry)) == OK)
    assert(packer.flush() == OK)
    quit()
