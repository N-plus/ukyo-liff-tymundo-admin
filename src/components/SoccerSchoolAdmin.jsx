// src/components/SoccerSchoolAdmin.jsx
import React, { useState, useEffect } from 'react';
import { Users, Link, RotateCcw, Search, Plus, X } from 'lucide-react';

const SoccerSchoolAdmin = () => {
    // ── State 定義 ─────────────────────────────────
    const [players, setPlayers] = useState([]);
    const [lineUsers, setLineUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('players');
    const [showPlayerForm, setShowPlayerForm] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newPlayerName, setNewPlayerName] = useState('');

    // ── JSON 読み込み ────────────────────────────────
    useEffect(() => {
        fetch('/db.json')
            .then(res => res.json())
            .then(data => {
                // players をアプリ内で扱いやすい形にマッピング
                setPlayers(
                    data.players.map(p => ({
                        id: p.player_id,
                        name: p.player_name,
                        substitute_count: p.substitute_count,
                        family_id: p.family_id,
                        created_at: p.created_at
                    }))
                );
                // line_user を同様にマッピング
                setLineUsers(
                    data.line_user.map(u => ({
                        id: u.id,
                        line_user_id: u.line_user_id,
                        display_name: u.line_user_name,
                        picture_url: u.picture_url,
                        family_id: u.family_id,
                        status: u.status,
                        created_at: u.created_at
                    }))
                );
            })
            .catch(console.error);
    }, []);

    // ── ヘルパー関数 ───────────────────────────────
    const updateTransferCount = (playerId, delta) => {
        setPlayers(players.map(p =>
            p.id === playerId
                ? { ...p, substitute_count: Math.max(0, p.substitute_count + delta) }
                : p
        ));
    };

    const resetTransferCount = playerId => {
        setPlayers(players.map(p =>
            p.id === playerId
                ? { ...p, substitute_count: 0 }
                : p
        ));
    };

    const getLinkedParents = player =>
        lineUsers.filter(u => u.family_id === player.family_id);

    const getUnlinkedParents = player =>
        lineUsers.filter(u => u.family_id !== player.family_id);

    const linkParentToPlayer = (player, parent) => {
        setLineUsers(lineUsers.map(u =>
            u.id === parent.id
                ? { ...u, family_id: player.family_id }
                : u
        ));
    };

    const unlinkParentFromPlayer = (player, parent) => {
        setLineUsers(lineUsers.map(u =>
            u.id === parent.id
                ? { ...u, family_id: null }
                : u
        ));
    };

    const handleAddPlayer = () => {
        if (!newPlayerName.trim()) return;
        const newP = {
            id: Date.now().toString(),
            name: newPlayerName.trim(),
            substitute_count: 0,
            family_id: null,
            created_at: new Date().toISOString()
        };
        setPlayers([newP, ...players]);
        setNewPlayerName('');
        setShowPlayerForm(false);
    };

    const filteredPlayers = players.filter(p =>
        p.name.includes(searchTerm)
    );
    const filteredLineUsers = lineUsers.filter(u =>
        u.display_name.includes(searchTerm)
    );

    // ── JSX ────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダー */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">T.Y.MUNDO管理画面</h1>
                    </div>
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="検索..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* タブ */}
            <div className="max-w-7xl mx-auto px-4 border-b border-gray-200">
                <nav className="flex space-x-8">
                    {['players', 'parents', 'links'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab === 'players'
                                ? '選手管理'
                                : tab === 'parents'
                                    ? '保護者管理'
                                    : '紐づけ管理'}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
                {/* ── 選手タブ ── */}
                {activeTab === 'players' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">選手一覧</h2>
                            <button
                                onClick={() => setShowPlayerForm(true)}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-600"
                            >
                                <Plus className="w-4 h-4" /> <span>選手追加</span>
                            </button>
                        </div>
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">選手名</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">振替回数</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">紐づけ済み保護者</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPlayers.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">{p.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => updateTransferCount(p.id, -1)}
                                                        disabled={p.substitute_count === 0}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                                                    >-</button>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${p.substitute_count > 0
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {p.substitute_count}
                                                    </span>
                                                    <button onClick={() => updateTransferCount(p.id, 1)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                                                    >+</button>
                                                    <button onClick={() => resetTransferCount(p.id)} title="リセット"
                                                        className="p-1 text-gray-400 hover:text-gray-600"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {getLinkedParents(p).map(u => (
                                                        <span key={u.id} className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                                                            {u.display_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => {
                                                    setSelectedPlayer(p);
                                                    setShowLinkModal(true);
                                                }}
                                                    className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                                                >
                                                    <Link className="w-4 h-4" /> <span>紐づけ</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── 保護者タブ ── */}
                {activeTab === 'parents' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">保護者一覧（LINE登録済み）</h2>
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">表示名</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">LINE ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">登録日</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">紐づけ済み選手</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredLineUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4"><img src={u.picture_url} alt={u.display_name} className="w-10 h-10 rounded-full object-cover" /></td>
                                            <td className="px-6 py-4">{u.display_name}</td>
                                            <td className="px-6 py-4">{u.line_user_id}</td>
                                            <td className="px-6 py-4">{u.created_at}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {players
                                                        .filter(p => p.family_id === u.family_id)
                                                        .map(p => (
                                                            <span key={p.id} className="px-2 py-1 text-xs bg-blue-100 rounded-full">
                                                                {p.name}
                                                            </span>
                                                        ))
                                                    }
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── 紐づけタブ ── */}
                {activeTab === 'links' && selectedPlayer && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">「{selectedPlayer.name}」の保護者紐づけ管理</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-medium mb-2">紐づけ可能な保護者</h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {getUnlinkedParents(selectedPlayer).map(u => (
                                        <div key={u.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                            <span>{u.display_name}</span>
                                            <button onClick={() => linkParentToPlayer(selectedPlayer, u)}
                                                className="text-green-600 hover:text-green-900">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-medium mb-2">紐づけ済み保護者</h3>
                                <div className="space-y-2">
                                    {getLinkedParents(selectedPlayer).map(u => (
                                        <div key={u.id} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                                            <span>{u.display_name}</span>
                                            <button onClick={() => unlinkParentFromPlayer(selectedPlayer, u)}
                                                className="text-red-600 hover:text-red-900">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setShowLinkModal(false)}
                            className="mt-6 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                            閉じる
                        </button>
                    </div>
                )}
            </div>

            {/* ── 選手追加フォーム ── */}
            {showPlayerForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-medium mb-4">新しい選手を追加</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">選手名</label>
                                <input
                                    type="text"
                                    value={newPlayerName}
                                    onChange={e => setNewPlayerName(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="選手名を入力"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-6 space-x-3">
                            <button onClick={() => setShowPlayerForm(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                                キャンセル
                            </button>
                            <button onClick={handleAddPlayer}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                                追加
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SoccerSchoolAdmin;
